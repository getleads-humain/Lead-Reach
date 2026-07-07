---
title: "Data Security & Privacy — LeadReach Security Architecture and Compliance"
category: product
grade: A
last_reviewed: "2026-07-03"
tags: [security, privacy, compliance, soc2, gdpr, ccpa, encryption, pii, data-retention, incident-response, dpa]
---

# Data Security & Privacy — LeadReach Security Architecture and Compliance

## Executive Summary

LeadReach processes personal data of millions of business professionals globally, making data security and privacy foundational to platform operations. The platform maintains SOC 2 Type II certification, complies with GDPR, CCPA/CPRA, CAN-SPAM, and TCPA, and implements defense-in-depth security measures across every layer of the architecture. All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Personally Identifiable Information (PII) is handled through a strict classification framework with role-based access controls, automated retention policies, and comprehensive audit logging.

This document serves as the authoritative reference for LeadReach's security architecture, compliance certifications, data handling practices, sub-processor governance, and incident response procedures. It is intended for security evaluators, compliance officers, procurement teams, and any stakeholder requiring a thorough understanding of how LeadReach protects customer and prospect data.

## Compliance Certifications & Frameworks

### SOC 2 Type II

LeadReach maintains SOC 2 Type II certification, audited annually by an independent third-party assessor. The certification covers the Trust Service Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy.

**Scope of Certification**:
- LeadReach production environment (Vercel-hosted application)
- Supabase PostgreSQL database instances
- Agent pipeline execution infrastructure
- Browser automation services
- Email delivery infrastructure
- Customer support and operations processes

**Key Controls**:
- Logical access controls with multi-factor authentication (MFA) required for all staff
- Automated patching and vulnerability management (24-hour critical patch SLA)
- Encryption at rest and in transit for all data stores
- Change management controls with code review requirements
- Incident response procedures with 72-hour notification commitment
- Background checks for all employees with production access
- Regular penetration testing by independent security firms (quarterly)

**Audit Report Availability**: Current SOC 2 Type II report is available under NDA to qualified customers. Contact security@leadreach.ai to request.

### GDPR (EU General Data Protection Regulation)

LeadReach operates as a data processor on behalf of its customers (data controllers) and as a data controller for its own customer data.

**Data Processing Agreement (DPA)**: Standard DPA available for all customers, incorporating:
- Article 28 requirements (processor obligations)
- Standard Contractual Clauses (SCCs) for EU-US data transfers
- Data Privacy Framework (DPF) certification for the LeadReach US entity
- Sub-processor notification provisions (30-day advance notice)
- Data subject rights assistance obligations
- Audit rights for the data controller

**Lawful Basis for Processing**: LeadReach processes B2B contact data under legitimate interest (Article 6(1)(f)), with documented Legitimate Interest Assessments (LIAs) for each processing activity. Customers may specify alternative lawful bases per campaign.

**Data Subject Rights Handling**:

| Right | LeadReach Response | Timeline |
|-------|-------------------|----------|
| Right to be informed | Privacy policy + processing notices | Continuous |
| Right of access | Data export API + manual fulfillment | 30 days |
| Right to rectification | Self-service correction + manual update | 30 days |
| Right to erasure | Cascading delete across all systems | 30 days |
| Right to restrict processing | Per-field processing flags | 48 hours |
| Right to data portability | JSON/CSV export via API | 30 days |
| Right to object | One-click unsubscribe + suppression | Immediate |
| Automated decision-making | Human review available on request | 30 days |

### CCPA / CPRA (California Consumer Privacy Act)

LeadReach complies with CCPA/CPRA for California residents' data:

- **Right to Know**: Privacy policy discloses all categories of personal information collected, purposes, and sources
- **Right to Delete**: Erasure requests honored within 45 days
- **Right to Opt Out of Sale**: "Do Not Sell My Personal Information" link on leadreach.ai; LeadReach does not sell personal information to third parties
- **Right to Non-Discrimination**: No service degradation for exercising privacy rights
- **Sensitive Personal Information**: LeadReach does not collect sensitive personal information as defined by CPRA

### CAN-SPAM Act Compliance

Every email sent through LeadReach includes:
- Valid physical postal address in email footer
- Clear, conspicuous unsubscribe mechanism (one-click)
- Accurate "From" name and email address
- Non-deceptive subject lines
- Unsubscribe requests honored within 10 business days (target: immediate via Flow agent)

### TCPA Compliance

- No auto-dialing of mobile phone numbers without prior express written consent
- Do Not Call registry checked before any outbound calls
- Calling hours restricted to 8am-9pm prospect local time
- Caller identification provided immediately upon connection
- Internal DNC list maintained and checked before every call attempt

## Data Encryption

### Encryption at Rest

| Data Category | Encryption Standard | Key Management |
|---------------|-------------------|----------------|
| Database (Supabase PostgreSQL) | AES-256 | Supabase-managed with customer-managed key (CMK) option for Enterprise |
| Object Storage | AES-256 | Cloud provider-managed |
| Backups | AES-256 | Encrypted before storage; separate key hierarchy |
| Session Tokens | AES-256-GCM | Rotated every 24 hours |
| API Keys | AES-256-GCM | Encrypted at rest; decrypted only in memory during use |
| LLM Prompts/Responses | AES-256 | Encrypted in database; access-logged |

### Encryption in Transit

| Connection Type | Protocol | Certificate Management |
|----------------|----------|----------------------|
| User ↔ LeadReach | TLS 1.3 | Auto-renewed via Vercel (Let's Encrypt) |
| LeadReach ↔ Supabase | TLS 1.3 | Supabase-managed certificates |
| LeadReach ↔ LLM APIs | TLS 1.3 | Provider-managed certificates |
| LeadReach ↔ Data Source APIs | TLS 1.3 | Pinned certificates for critical APIs |
| Inter-service (microservices) | mTLS 1.3 | Service mesh certificates, auto-rotated |
| Email delivery | TLS (opportunistic) | DANE/MTA-STS where supported |

### Key Rotation

- **Application encryption keys**: Rotated every 90 days automatically
- **Database encryption keys**: Rotated annually or upon security event
- **API keys (user-provided)**: Users can rotate keys at any time; old keys invalidated within 60 seconds
- **TLS certificates**: Auto-renewed 30 days before expiry

## PII Handling & Classification

### Data Classification Framework

| Classification | Examples | Storage | Access | Retention |
|---------------|----------|---------|--------|-----------|
| **Restricted** | SSN, credit card numbers, health data | Not collected by LeadReach | N/A | N/A |
| **Confidential** | Work email, work phone, job title | Encrypted at rest | Role-based, need-to-know | 24 months (then re-confirm or delete) |
| **Internal** | Company name, industry, revenue range | Encrypted at rest | Role-based | 24 months |
| **Public** | Company website, LinkedIn public profile | Standard access | All authenticated users | Until deletion requested |

### PII Data LeadReach Collects

**Business Contact Information (Confidential)**:
- Work email address
- Work phone number
- Professional title / role
- Company name and affiliation
- Professional social media URLs (LinkedIn, Twitter, GitHub)
- Work address (company headquarters)

**Firmographic Data (Internal)**:
- Industry and sub-industry
- Employee count range
- Revenue range
- Funding stage and amount
- Technology stack
- Headquarters location (country, state, city)

**Behavioral Data (Internal)**:
- Recent news mentions
- Trigger events (funding, M&A, leadership changes)
- Hiring patterns
- Content publishing activity

### PII Data LeadReach Does NOT Collect

The following categories are explicitly excluded from collection, even if publicly available:

- Home address or personal phone numbers
- Personal (non-work) email addresses
- Health or medical information
- Religion, political opinions, or trade union membership
- Racial or ethnic origin
- Sexual orientation or gender identity
- Biometric data
- Financial account numbers or credit card numbers
- Social security numbers or national ID numbers
- Data from individuals under 18 years of age
- Content from private social media accounts

### PII Minimization Principles

1. **Collect only what's necessary**: Each agent's data requirements are defined by its function; no agent collects more fields than needed
2. **Purpose limitation**: Data collected for prospecting is not repurposed for advertising or sold to third parties
3. **Accuracy**: Stale data is flagged and re-verified; disputed fields are marked, not silently resolved
4. **Storage limitation**: Automated retention policies enforce 24-month data lifecycle
5. **Access limitation**: Row-Level Security (RLS) in Supabase ensures tenant isolation; role-based access within tenant

## Data Retention & Deletion

### Retention Schedule

| Data Type | Retention Period | Deletion Method |
|-----------|-----------------|-----------------|
| Prospect PII (contact data) | 24 months from last interaction | Cascading hard delete across all systems |
| Enriched firmographics | 24 months from last enrichment | Hard delete; re-enrichment requires new consent |
| Outreach content (sent emails) | 36 months (regulatory retention) | Anonymized after retention period |
| Campaign analytics | 36 months | Aggregated after 12 months; raw data deleted |
| Audit logs | 7 years (regulatory requirement) | Secure deletion after retention period |
| User account data | Duration of account + 90 days | Hard delete 90 days after account closure |
| Suppression list entries | Duration of business relationship + 5 years | Required for compliance; cannot be deleted early |
| Support tickets | 3 years | Anonymized after retention period |
| LLM prompts/responses | 12 months for quality improvement | Hard delete after retention period |

### Deletion Procedures

**Automated Deletion**:
- Daily cron job scans for data exceeding retention period
- Cascading delete across Supabase tables, object storage, cache layers, and search indices
- Deletion confirmation logged in audit trail

**Data Subject Erasure Request (GDPR Article 17)**:
1. Request received via privacy@leadreach.ai or customer support
2. Identity verification (email confirmation + account verification)
3. Data inventory compiled (all systems containing the data subject's PII)
4. Cascading delete executed across all systems within 30 days
5. Confirmation sent to data subject
6. Deletion logged in compliance audit trail

**Right to Be Forgotten vs. Legal Retention**:
- If data is subject to ongoing legal hold, deletion is suspended until hold is lifted
- Prospects who have unsubscribed remain on the suppression list (required by CAN-SPAM) but all other PII is deleted
- Financial records required for tax compliance are retained per jurisdiction requirements

## Sub-Processor List

LeadReach engages the following sub-processors to process customer data:

| Sub-Processor | Purpose | Data Accessed | Location | DPA Status |
|---------------|---------|---------------|----------|------------|
| **Vercel** | Application hosting, edge functions | All application data in transit | US, EU (configurable) | DPA on file |
| **Supabase** | Database hosting, authentication, storage | All persistent data at rest | US, EU (configurable) | DPA on file; SOC 2 Type II |
| **OpenAI** | LLM inference (if configured) | Prompts and responses | US | DPA on file; SOC 2 Type II |
| **Zhipu AI** | LLM inference (default provider) | Prompts and responses | China | DPA on file |
| **Exa** | Web search API | Search queries, company names | US | DPA on file |
| **SendGrid** | Email delivery (if configured) | Email content, recipient addresses | US | DPA on file; SOC 2 Type II |
| **Postmark** | Email delivery (if configured) | Email content, recipient addresses | US | DPA on file; SOC 2 Type II |
| **Stripe** | Payment processing | Billing data (not prospect data) | US | DPA on file; SOC 2 Type II |
| **Redis Cloud** | Caching layer | Cached search results (no PII in cache keys) | US | DPA on file; SOC 2 Type II |
| **Playwright/Browser Service** | Dynamic content extraction | URLs, page content | Customer-hosted | N/A (customer infrastructure) |

### Sub-Processor Changes

LeadReach provides 30 days' advance notice before adding or changing sub-processors. Customers may object to new sub-processors and, if the objection cannot be resolved, may terminate their agreement without penalty.

## Data Processing Agreement (DPA) Terms

### Standard DPA Provisions

1. **Processing Instructions**: LeadReach processes personal data only in accordance with customer's documented instructions
2. **Confidentiality**: All personnel processing personal data are bound by confidentiality obligations
3. **Security Measures**: LeadReach implements the technical and organizational measures described in this document
4. **Sub-Processing**: LeadReach does not engage sub-processors without prior authorization; notification-based approval process
5. **Data Subject Assistance**: LeadReach assists customers in responding to data subject requests
6. **Audit Rights**: Customers may audit LeadReach's compliance (at customer's expense, with reasonable notice)
7. **Data Return/Deletion**: Upon termination, LeadReach returns or deletes all personal data within 60 days
8. **Breach Notification**: LeadReach notifies customers of personal data breaches within 48 hours of discovery

### International Data Transfers

**EU → US Transfers**: Protected by Standard Contractual Clauses (SCCs) incorporated into the DPA, supplemented by the EU-US Data Privacy Framework (DPF) certification for the LeadReach US entity.

**China Cross-Border Transfers**: For Chinese personal data, LeadReach supports data localization within China-based infrastructure. Cross-border transfers follow PIPL requirements including security assessments and standard contracts.

**Other Jurisdictions**: LeadReach complies with local data protection laws including Brazil's LGPD, Canada's PIPEDA, Australia's Privacy Act, India's DPDP Act, South Korea's PIPA, and Japan's APPI. Specific provisions are added to the DPA per customer jurisdiction.

## Security Incident Response

### Incident Classification

| Severity | Definition | Examples | Response Time |
|----------|-----------|----------|---------------|
| **Critical (P1)** | Confirmed breach of personal data or system compromise | Database exfiltration, ransomware, unauthorized access to PII | 1 hour initial response; 48-hour customer notification |
| **High (P2)** | Potential breach or significant security event | Suspicious access patterns, vulnerability exploitation attempt | 4 hour initial response; 72-hour customer notification if confirmed |
| **Medium (P3)** | Security event with limited impact | Failed authentication spikes, policy violation | 24 hour initial response; weekly summary notification |
| **Low (P4)** | Informational security events | Successful blocked attacks, minor configuration issues | Next business day; monthly summary |

### Incident Response Process

**Phase 1: Detection & Triage (0-1 hour)**
- Automated monitoring detects anomalies (unusual API patterns, access from new geographies, failed auth spikes)
- On-call security engineer triages alert, classifies severity
- Incident commander assigned for P1/P2 incidents

**Phase 2: Containment (1-4 hours)**
- Affected systems isolated (network segmentation, access revocation)
- Evidence preservation (forensic snapshots, log preservation)
- Impact assessment (what data, how many records, which tenants)

**Phase 3: Notification (4-72 hours)**
- **Internal**: Security team, engineering leadership, legal counsel
- **Customers**: For P1/P2 incidents, affected customers notified within 48 hours with:
  - Nature of the breach
  - Categories and approximate number of records affected
  - Measures taken to contain the breach
  - Measures customers should take
  - Contact point for further information
- **Regulatory**: GDPR supervisory authority notified within 72 hours of becoming aware of a breach affecting EU data subjects
- **Data Subjects**: Notified "without undue delay" if breach is likely to result in high risk to their rights

**Phase 4: Eradication & Recovery (24-72 hours)**
- Root cause identified and remediated
- Systems patched and hardened against recurrence
- Credentials rotated for any compromised accounts
- Enhanced monitoring deployed for affected systems

**Phase 5: Post-Incident Review (1-2 weeks)**
- Blameless post-mortem with all involved parties
- Root cause analysis documented
- Process improvements identified and assigned
- Customer communication updated with final findings
- SOC 2 audit trail updated

### Incident Communication Channels

- **Status Page**: status.leadreach.ai provides real-time incident status
- **Email**: security@leadreach.ai for incident inquiries
- **In-App**: Banner notifications for active incidents affecting the platform
- **Direct**: Account managers contact affected Enterprise customers directly for P1 incidents

## Technical Security Controls

### Application Security

- **Authentication**: Supabase Auth with JWT tokens; MFA required for admin accounts; SSO/SAML available for Enterprise
- **Authorization**: Row-Level Security (RLS) in PostgreSQL enforces tenant isolation at the database level; API-layer permission checks via `plan-gate.ts`
- **Input Validation**: All user inputs validated via `input-validation.ts`; parameterized queries prevent SQL injection; URL guard prevents SSRF attacks
- **Output Encoding**: All dynamic content HTML-encoded to prevent XSS; Content Security Policy (CSP) headers enforced
- **Rate Limiting**: Per-IP and per-user rate limiting on all API routes (`rate-limiter.ts`); 429 responses with retry-after headers
- **Security Headers**: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy enforced via `security-headers.ts`

### Infrastructure Security

- **Network**: Vercel's edge network with DDoS protection; WAF rules for common attack patterns
- **Patching**: Automated dependency updates via Dependabot; critical patches deployed within 24 hours
- **Vulnerability Scanning**: CodeQL scanning on every pull request; weekly full-repository SAST scans; quarterly penetration testing
- **Secrets Management**: All secrets stored in Vercel encrypted environment variables; no secrets in code or git history; pre-commit hooks prevent secret commits
- **Logging**: Structured audit logging for all data access, authentication events, and administrative actions; logs retained for 7 years

### Agent-Specific Security

- **SSRF Prevention**: URL guard (`url-guard.ts`) validates all external URLs before fetching; blocks private IP ranges, metadata endpoints, and known dangerous domains
- **Prompt Injection Defense**: LLM outputs validated through safety system before use; no raw LLM output trusted for critical operations
- **Data Isolation**: Agent pipeline sessions are isolated per tenant; no cross-tenant data leakage possible
- **Rate Limit Enforcement**: Agent execution respects per-tenant rate limits; plan-gate checks prevent exceeding subscription limits

## LeadReach Agent Integration

Each agent in the 8-agent pipeline has specific security responsibilities:

| Agent | Security Role |
|-------|--------------|
| **Atlas** | Enforces data minimization in context packets; only extracts entities necessary for the classified intent; prevents over-collection of PII |
| **Scout** | Searches only public/professional sources; respects robots.txt and terms of service; cites every source URL for audit trail; implements exponential backoff for rate limit compliance |
| **Forge** | Applies source hierarchy for conflict resolution; marks unverified fields as unverified (never fabricates); does not enrich with personal data (home address, personal phone); implements PII detection in enriched profiles |
| **Sage** | Analyzes only professional/business intelligence; does not infer protected characteristics; surfaces compliance requirements for prospect jurisdictions |
| **Judge** | Applies same qualification criteria regardless of demographics; does not score based on protected characteristics; documents data quality issues that could bias scoring |
| **Bard** | Never references personal data (family, health, religion) in outreach; includes CAN-SPAM/GDPR compliance elements in every email; uses professional tone only; implements deliverability best practices to avoid spam filters |
| **Flow** | Honors opt-outs within 10 business days (target: instant); maintains suppression lists accurately; prevents sending to suppressed prospects (including race condition checks); enforces calling hour restrictions; implements per-mailbox send limits |
| **Echo** | Aggregates data in reports (no individual exposure without permission); anonymizes reports when possible; complies with data subject access requests; does not report on protected characteristics |

## Best Practices

1. **Enable MFA for all accounts**: Multi-factor authentication should be required for every LeadReach user, especially admin accounts and team leads with broad data access.

2. **Review sub-processor list quarterly**: Ensure your DPA covers all current sub-processors. Contact LeadReach if you have concerns about specific sub-processors.

3. **Configure data residency**: Enterprise customers can configure Supabase instances in EU or US regions. Choose the region closest to your data subjects for compliance and latency optimization.

4. **Implement least-privilege access**: Use LeadReach's role-based access control to limit team members' access to only the data and features they need. Regularly review access grants.

5. **Monitor audit logs**: Review LeadReach audit logs for unusual access patterns, especially bulk data exports and admin actions. Set up alerts for anomalous activity.

6. **Test your incident response**: Conduct tabletop exercises using LeadReach's incident response process. Ensure your team knows who to contact and what to do in a security event.

7. **Rotate API keys regularly**: Even though LeadReach encrypts API keys at rest, rotate your third-party API keys (Exa, SendGrid, etc.) on a regular cadence—quarterly at minimum.

8. **Review data retention compliance**: Ensure your use of LeadReach aligns with your organization's data retention policies. Adjust LeadReach's retention settings if your policies require shorter retention periods.

9. **Train your team on compliance**: Ensure every team member using LeadReach understands CAN-SPAM, GDPR, and TCPA requirements. The compliance checklist in the global regulations document should be reviewed before every campaign.

10. **Request penetration test reports**: Enterprise customers can request summaries of LeadReach's most recent penetration test under NDA. Review findings and verify remediation.

## Cross-References

- [LeadReach Platform Overview](./leadreach-platform-overview.md) — Platform capabilities and architecture overview
- [Agent Pipeline Architecture](./agent-pipeline-architecture.md) — 8-agent pipeline design and security integration
- [Pricing & Packaging Guide](./pricing-packaging-guide.md) — Enterprise tier security features
- [Compliance: Global Regulations](../compliance/global-regulations.md) — Detailed GDPR, CAN-SPAM, CCPA, TCPA reference
- [Agent Training: Atlas](../agents/atlas.md) — Atlas data minimization and intent classification
- [Agent Training: Scout](../agents/scout.md) — Scout source citation and rate limit compliance
- [Agent Training: Forge](../agents/forge.md) — Forge verification and PII handling
- [Agent Training: Bard](../agents/bard.md) — Bard compliance enforcement in outreach
- [Agent Training: Flow](../agents/flow.md) — Flow suppression list management and opt-out handling
