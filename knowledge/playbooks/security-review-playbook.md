---
title: "Security Review Playbook — Playbook"
category: playbook
playbook: security-review-playbook
tags: [security, compliance, SOC2, GDPR, procurement, IT-review, vendor-assessment]
last_reviewed: "2026-07-04"
grade: "A"
author: "LeadReach Knowledge Team"
---

# Security Review Playbook — Playbook

This playbook is the canonical reference for navigating customer security reviews during the LeadReach sales process. It covers preparation, questionnaire response, compliance documentation, stakeholder management, and common security objection resolution. Used by Forge (Documentation), Sage (Research), Bard (Communication), and Flow (Process Tracking).

## 1. Why Security Reviews Matter

Security reviews are the **#1 cause of deal delay** in enterprise B2B SaaS. According to Gartner, 78% of enterprise deals now require a formal security assessment, up from 45% in 2020. The average security review adds **18-35 days** to the sales cycle, and 15% of deals die in the security review — not because the product fails, but because the seller is unprepared.

LeadReach's approach to security reviews is **proactive, not reactive**. We prepare security documentation before the deal reaches the review stage, pre-populate questionnaires, and maintain a living security posture document that is updated quarterly. The goal: turn the security review from a deal blocker into a trust accelerator.

## 2. LeadReach Security Posture Summary

### 2.1 Certifications and Compliance

| Certification / Standard | Status | Scope | Last Audit |
|--------------------------|--------|-------|------------|
| SOC 2 Type II | Certified | All systems and operations | Q4 2025 |
| ISO 27001 | Certified | Information security management | Q3 2025 |
| GDPR | Compliant | EU data processing | Ongoing |
| CCPA | Compliant | California consumer data | Ongoing |
| UK GDPR + DPA | Compliant | UK data processing | Ongoing |
| HIPAA | Compliant (with BAA) | Health data (Enterprise tier) | Q2 2025 |
| FERPA | Not applicable | — | — |
| PCI DSS | Level 4 (payment processing via Stripe) | Payment data | Q1 2026 |

### 2.2 Data Architecture

| Aspect | Detail |
|--------|--------|
| Data residency | US (primary), EU (Frankfurt) for Enterprise tier |
| Encryption at rest | AES-256 |
| Encryption in transit | TLS 1.2+ |
| Key management | AWS KMS with customer-managed keys (Enterprise) |
| Database | PostgreSQL on AWS RDS, encrypted, multi-AZ |
| Backup | Continuous, 30-day retention, encrypted |
| Logging | CloudTrail + custom audit logs, 1-year retention |
| Network | AWS VPC, private subnets, WAF, DDoS protection |

### 2.3 Access Controls

| Feature | Detail |
|---------|--------|
| Authentication | SAML 2.0 SSO (Enterprise), MFA for all admin accounts |
| Authorization | Role-based access control (RBAC) with custom roles |
| SCIM provisioning | Supported (Enterprise tier) |
| Session management | Configurable timeout, concurrent session limits |
| API authentication | OAuth 2.0 + API keys with rotation |
| Audit logging | All access events logged with user, timestamp, IP |
| Privileged access | Break-glass procedure, MFA + approval for admin actions |

### 2.4 Incident Response

| Aspect | Detail |
|--------|--------|
| Incident response plan | Documented, tested quarterly |
| Notification SLA | 24 hours for confirmed breach (GDPR: 72 hours to authority) |
| Communication channel | Dedicated incident email + phone |
| Post-incident review | Root cause analysis published within 5 business days |
| Penetration testing | Annual by third party (NCC Group) |
| Bug bounty program | HackerOne, active |

## 3. The Security Review Workflow (Step-by-Step)

### Step 1: Early Detection (Scout + Flow, Deal Stage: Discovery)

**Proactive indicator**: When an enterprise deal enters the pipeline, Flow agent checks:
- Does the customer's industry require enhanced security? (FinTech, HealthTech, Gov)
- Has the customer mentioned security/compliance in discovery?
- Does the AE anticipate a security review based on company size?

If yes, Flow agent **flags the deal for security preparation** immediately — don't wait for the customer to ask.

### Step 2: Pre-Emptive Preparation (Forge, Days 1-3)

Forge agent prepares a **Security Readiness Package** tailored to the customer's industry and region:

| Document | Content | Format |
|----------|---------|--------|
| Security Overview | One-page summary of LeadReach security posture | PDF |
| SOC 2 Type II Report | Full report (under NDA) | PDF |
| Security Questionnaire (pre-filled) | 80%+ pre-populated based on standard questions | Excel / CSA CAIQ |
| DPA Template | Data Processing Agreement for customer's region | Word / PDF |
| Architecture Diagram | Data flow, encryption, access controls | PDF |
| Penetration Test Summary | Most recent annual pen test executive summary | PDF |
| Incident Response Plan | Summary of IR procedures | PDF |
| Sub-processor List | All sub-processors with locations and purposes | PDF |

### Step 3: Stakeholder Identification (Atlas, Days 1-5)

Security reviews involve stakeholders the AE may not have met:
- **CISO / Information Security Director**: Owns the review
- **IT Security Analyst**: Executes the questionnaire
- **Data Protection Officer (DPO)**: Reviews GDPR/data residency (EU)
- **Compliance Officer**: Reviews industry-specific compliance
- **Procurement**: Manages the vendor risk assessment process

Atlas agent maps these stakeholders and coordinates outreach through the champion.

### Step 4: Security Introduction Meeting (AE + Security Team, Days 5-10)

A dedicated meeting between LeadReach and the customer's security team:
1. **Introductions**: AE introduces LeadReach security point of contact
2. **Overview**: 10-minute walkthrough of LeadReach security posture
3. **Process alignment**: Agree on review timeline, required documents, and communication channel
4. **Questionnaire handoff**: Provide pre-filled questionnaire
5. **Known gaps**: Proactively address any areas where LeadReach may not meet their requirements (honesty builds trust)

### Step 5: Questionnaire Response (Forge + Bard, Days 10-20)

The customer sends their security questionnaire. Forge agent:
1. Maps each question to the pre-filled response library
2. Flags questions that require custom answers (customer-specific)
3. Drafts custom answers with Bard agent (security-compliant language)
4. Routes for internal review (LeadReach security team, 2-day SLA)
5. Returns completed questionnaire to customer

**Target**: Return completed questionnaire within 5 business days.

### Step 6: Follow-Up and Clarification (Days 20-30)

Customer's security team may have follow-up questions:
- **Technical deep-dives**: Schedule a call with LeadReach's security engineer
- **Documentation requests**: Forge provides requested docs within 2 business days
- **Policy exceptions**: If customer requires a policy LeadReach doesn't support, escalate to CISO for evaluation

### Step 7: Approval and Close (Days 30-45)

- Customer's security team issues approval (or conditional approval with remediation items)
- Flow agent tracks approval status and alerts AE
- If conditional: Bard drafts remediation plan with timeline
- Full approval: proceed to contract execution

## 4. Common Security Questionnaire Responses

### 4.1 Data Handling

**Q: How is customer data segregated?**
> LeadReach uses logical data segregation within a multi-tenant architecture. Each customer's data is isolated through tenant-specific database schemas and access controls. Cross-tenant data access is technically prevented at the application layer and verified through quarterly access audits.

**Q: Where is customer data stored?**
> Primary data center: AWS US-East-1 (Virginia). EU data residency available on Enterprise tier: AWS EU-Central-1 (Frankfurt). Data does not leave the selected region unless explicitly configured by the customer for cross-region analytics.

**Q: How long is customer data retained after contract termination?**
> 30 days post-termination for data export. 90 days post-termination for complete deletion from all systems including backups. Customer can request expedited deletion.

### 4.2 Encryption and Key Management

**Q: What encryption standards are used?**
> Data at rest: AES-256 (AWS KMS-managed keys). Data in transit: TLS 1.2 minimum (TLS 1.3 preferred). Key rotation: automatic, annual. Enterprise tier: customer-managed keys (CMK) supported.

**Q: Are encryption keys shared between customers?**
> No. Each customer's encryption keys are unique and managed through AWS KMS with dedicated key policies. Key access is restricted to authorized LeadReach personnel with MFA and audit logging.

### 4.3 Access Controls

**Q: Who at LeadReach can access customer data?**
> Access follows the principle of least privilege. Only authorized personnel in Customer Success and Engineering (for troubleshooting) can access customer data, and only with a valid support ticket. All access is logged, time-limited, and requires manager approval for production systems.

**Q: How are LeadReach employees vetted?**
> Background checks for all employees (criminal, education, employment). Annual security awareness training. Acceptable use policy acknowledgment quarterly. Access terminated immediately upon role change or departure.

### 4.4 Incident Response

**Q: What is your breach notification process?**
> Confirmed breaches are communicated to affected customers within 24 hours via email and phone. For GDPR-covered data, DPA notification within 72 hours. Post-incident root cause analysis shared within 5 business days.

**Q: How often do you test your incident response plan?**
> Quarterly tabletop exercises. Annual full-scale simulation. Results are reviewed by the CISO and incorporated into the plan.

## 5. Agent Responsibilities

| Agent | Security Review Role |
|-------|---------------------|
| Atlas | Orchestrates security review process; manages timeline; coordinates stakeholders |
| Scout | Identifies security requirements based on customer industry and region |
| Forge | Maintains security documentation library; pre-fills questionnaires; provides requested docs |
| Sage | Researches customer's security posture, certifications, and known requirements |
| Judge | Evaluates deal risk based on security complexity; flags potential blockers |
| Bard | Composes security-related communications; drafts remediation plans |
| Flow | Tracks security review stages; enforces SLAs; manages approval workflows |
| Echo | Measures security review cycle time; tracks common questions; identifies documentation gaps |

## 6. Target Persona and ICP Criteria

### Security Review Stakeholders

| Persona | Title | Concern | How to Address |
|---------|-------|---------|---------------|
| The CISO | CISO, VP Security | Overall vendor risk | Executive summary; SOC 2 report; reference calls with peer CISOs |
| The Security Analyst | Security Engineer, InfoSec Analyst | Technical details | Detailed questionnaire; architecture diagram; pen test report |
| The DPO | Data Protection Officer | GDPR/data residency | DPA template; data flow diagram; sub-processor list |
| The Compliance Officer | Director of Compliance | Industry-specific compliance | HIPAA BAA (HealthTech); SOC 2 (FinTech); region-specific DPA |
| The Procurement Lead | Sr. Procurement Manager | Process and timeline | Clear timeline; pre-filled questionnaire; responsive communication |

## 7. Trigger Events That Activate This Playbook

| Trigger | Signal Source | Automated Action |
|---------|-------------|-----------------|
| Enterprise deal enters pipeline | CRM stage change | Flow flags for security preparation; Forge prepares readiness package |
| Customer mentions security/compliance in discovery | AE note in CRM | Scout identifies industry requirements; Sage researches customer certifications |
| Customer sends security questionnaire | Email (Forge detects) | Auto-route to Forge for response; start 5-day SLA timer |
| Customer requests SOC 2 report | AE / email | Forge sends under NDA; track access |
| Customer asks about data residency | AE / email | Provide architecture doc + data residency options |
| Customer requires HIPAA BAA | AE note | Route to legal for BAA preparation; 3-day SLA |
| Security review stalled >14 days | Flow agent timer | Escalate to AE; re-engage customer's security team |
| Customer's security team requests call | Calendar invitation | Schedule with LeadReach security engineer; prepare briefing |

## 8. Email / Sequence Templates

### Template 1: Proactive Security Package Delivery

**Subject**: `leadreach security documentation for [company]`

> Hi [first name],
>
> As your team evaluates LeadReach, I wanted to proactively share our security documentation — most security teams appreciate having this upfront rather than requesting it later.
>
> Attached:
> - Security Overview (one-page summary)
> - Architecture diagram (data flow + encryption)
> - Sub-processor list
> - DPA template for [region]
>
> Our full SOC 2 Type II report is available under NDA — happy to share if your team needs it.
>
> If your security team has a questionnaire, we can return it within 5 business days. We've pre-populated 80%+ of standard questions.
>
> [AE name]

### Template 2: Security Questionnaire Response Cover Letter

**Subject**: `completed security questionnaire — leadreach`

> Hi [first name],
>
> Attached is the completed security questionnaire for LeadReach. A few notes:
>
> - **Sections 1-4** (Data handling, Encryption, Access controls, Incident response): Standard responses from our SOC 2 audit
> - **Section 5** (Industry-specific): Customized for [customer's industry]
> - **Section 6** (Sub-processors): Current as of [date]; we notify customers 30 days before any changes
>
> If your team has follow-up questions, we can schedule a call with our Security Engineer, [name]. Typical turnaround for follow-ups is 2 business days.
>
> [AE name]

### Template 3: Remediation Plan (Conditional Approval)

**Subject**: `remediation plan for [company] security review`

> Hi [first name],
>
> Thank you for the conditional approval. We take the following items seriously and have prepared a remediation plan:
>
> | Item | Current State | Remediation | Timeline |
> |------|-------------|-------------|----------|
> | [Item 1] | [Current] | [Planned action] | [Date] |
> | [Item 2] | [Current] | [Planned action] | [Date] |
>
> We're committed to meeting your security requirements. Happy to schedule a follow-up review once remediation is complete.
>
> [AE name]

## 9. Objection Handling

| Objection | Root Cause | Response |
|-----------|-----------|----------|
| "You don't support [specific certification]" | Certification gap | "We're currently pursuing [certification]. Our SOC 2 Type II and ISO 27001 cover the same controls. Can we map the specific requirements to our existing certifications?" |
| "We need data residency in [country]" | Regional requirement | "Enterprise tier supports data residency in EU (Frankfurt). For other regions, we're evaluating [region] — can we discuss a timeline?" |
| "Your sub-processor list includes [vendor] we don't allow" | Vendor restriction | "We can discuss alternatives. [Vendor] is used for [purpose]. We've worked with customers who required alternative sub-processors. Let me check options with our engineering team." |
| "We need on-premises deployment" | Deployment requirement | "LeadReach is SaaS-only. However, we offer private cloud deployment on AWS with dedicated infrastructure for Enterprise customers. This provides similar isolation benefits." |
| "Your breach notification SLA is too slow" | Risk tolerance | "Our 24-hour SLA is faster than the industry standard (72 hours). For Enterprise customers, we can commit to 12-hour notification via direct phone call." |
| "We can't approve a vendor without [specific control]" | Control gap | "Let me understand the specific control requirement. We may have an equivalent control that addresses the same risk. Can we schedule a call with our security team to map it?" |
| "Your pen test is too old" | Recency concern | "Our most recent pen test was [date]. We conduct annual pen tests and can share the summary. If you need a more recent test, we can discuss scheduling." |

## 10. Success Metrics and KPIs

| Metric | Target | Source |
|--------|--------|--------|
| Security review cycle time | <30 days | Flow agent |
| Questionnaire turnaround time | <5 business days | Forge agent |
| Security approval rate (first submission) | >70% | CRM |
| Conditional approval remediation rate | >90% within 30 days | CRM |
| Deals lost in security review | <10% | CRM |
| Time from deal stage "security review" to approval | <21 days | CRM |
| Pre-emptive security package delivery rate | >80% of enterprise deals | Flow agent |
| Follow-up response time | <2 business days | Forge agent |

## 11. Common Pitfalls and How to Avoid Them

| Pitfall | Cause | Prevention |
|---------|-------|-----------|
| Waiting for customer to request security docs | Reactive approach; AE didn't flag for security prep | Flow agent auto-flags enterprise deals; Forge prepares package proactively |
| Incomplete questionnaire responses | Rushed completion; generic answers | Forge maintains detailed response library; custom answers reviewed by security team |
| Slow turnaround on follow-ups | Security team is busy; no SLA | 2-business-day SLA for follow-ups; Flow agent tracks and escalates |
| Not engaging the security team early enough | AE avoids security stakeholders | Atlas mandates security stakeholder identification by Day 5 |
| Losing track of security review status | No tracking; AE assumes it's proceeding | Flow agent tracks every security review with status updates |
| Over-promising on security capabilities | AE promises features that don't exist | All security commitments verified by Forge agent against current posture |
| Ignoring regional differences | Same security docs for US and EU customers | Sage identifies regional requirements; Forge customizes packages |

## 12. Integration Requirements

| Integration | Purpose | Priority |
|-------------|---------|----------|
| Security questionnaire platform (Iterative / Secureframe) | Automated questionnaire management | Critical |
| CRM (Salesforce/HubSpot) | Deal tracking, security review stage | Critical |
| Document management (Google Drive / SharePoint) | Secure document sharing under NDA | Critical |
| NDA / e-signature (DocuSign) | NDA execution for SOC 2 sharing | High |
| Compliance platform (Secureframe / Vanta) | Continuous compliance monitoring | High |
| Communication (Slack / Teams) | Internal coordination on security responses | Medium |
| Calendar (Google / Outlook) | Security review meeting scheduling | Medium |

## 13. Example Scenario

**Account**: MedFin Technologies, a HealthTech company (450 employees, US + EU operations)

**Deal**: Enterprise tier, 80 seats, $240K ACV

**Security complexity**: High — HealthTech + EU data + HIPAA applicable

**Motion executed**:
1. **Day 0**: Deal enters pipeline. Flow flags for security preparation (HealthTech + EU + Enterprise).
2. **Day 1**: Sage researches MedFin's security posture — SOC 2 certified, HIPAA compliant, DPO based in London.
3. **Day 2**: Forge prepares Security Readiness Package: SOC 2 report, architecture diagram, HIPAA BAA draft, EU DPA template, sub-processor list.
4. **Day 5**: AE delivers security package proactively: "Before your security team asks, here's everything they'll need."
5. **Day 7**: MedFin's IT Security Director responds — impressed by proactiveness. Sends their 150-question security questionnaire.
6. **Day 8**: Forge maps 127 questions to pre-filled library. 23 questions require custom answers. Bard drafts custom responses for security team review.
7. **Day 10**: LeadReach security team reviews custom answers. 3 minor edits. Approved.
8. **Day 12**: Completed questionnaire returned to MedFin (4 business days — within SLA).
9. **Day 15**: MedFin requests follow-up call on data residency for EU patients. LeadReach security engineer joins. Explains Frankfurt data center + CMK option.
10. **Day 18**: MedFin requests HIPAA BAA. Legal prepares and sends within 2 days.
11. **Day 22**: MedFin's DPO approves EU DPA with minor amendment (adds UK Addendum).
12. **Day 25**: MedFin's CISO issues conditional approval — requests annual pen test summary.
13. **Day 26**: Forge provides pen test summary. Full approval granted.
14. **Day 28**: Security review complete. Deal proceeds to contract execution.

**Outcome**: 28-day security review (vs. 45+ day industry average). Proactive preparation saved 2+ weeks. Deal closed on Day 42.

## 14. Escalation Paths

| Situation | Escalation Level | Action |
|-----------|-----------------|--------|
| Security questionnaire has 200+ custom questions | VP Engineering + Security | Dedicated sprint to complete; extend SLA to 7 days |
| Customer requires certification LeadReach doesn't have | CISO | Evaluate feasibility; provide timeline or alternative controls mapping |
| Data residency in unsupported region | VP Engineering | Evaluate infrastructure expansion; provide timeline |
| Customer requires on-premises deployment | CRO | Explain SaaS-only; offer private cloud alternative |
| Remediation items require product changes | VP Product | Assess roadmap fit; provide committed timeline |
| Security review stalled >21 days | VP Sales | Executive engagement with customer's CISO |
| Legal review of DPA/BAA stalled >5 days | General Counsel | Prioritize; assign dedicated legal resource |

## 15. Authoring Notes / Gaps

- Need **automated security questionnaire tool** — AI-assisted mapping of customer questions to response library.
- Need **per-industry security package templates** — HealthTech, FinTech, Government, Education.
- Need **customer security posture database** — track what each customer's security team typically requires.
- Need **SOC 2 report update process** — quarterly refresh with change log.
- Need **sub-processor change notification workflow** — automated alerts to customers 30 days before changes.
- Need **penetration test scheduling guide** — how to handle customer-requested pen tests.
- Need **security training for AEs** — basic security literacy to handle initial questions without escalation.

These will be addressed in future monthly gap reports.
