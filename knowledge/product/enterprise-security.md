---
title: "Enterprise Security & Compliance"
category: product
grade: A
last_reviewed: 2026-07-08
tags: [security, compliance, enterprise, soc2, encryption, gdpr, access-control]
---

# Enterprise Security & Compliance

## 1. Security Architecture

### Infrastructure

| Component | Configuration |
|-----------|---------------|
| Cloud Provider | AWS (us-east-1, eu-west-1) |
| Compute | ECS Fargate (isolated containers) |
| Database | RDS PostgreSQL (encrypted at rest) |
| Cache | ElastiCache Redis (encryption in transit) |
| Storage | S3 (SSE-S3 + SSE-KMS) |
| CDN | CloudFront (TLS 1.3) |
| WAF | AWS WAF with managed rule sets |
| DDoS | AWS Shield Advanced |

### Network Security

- VPC isolation with private subnets for application and database tiers
- Security groups enforcing least-privilege network access
- No direct internet access to database or cache tiers
- VPN required for administrative access
- API traffic routed through CloudFront + WAF

## 2. Data Encryption

### At Rest

| Data Type | Encryption Method | Key Management |
|-----------|-------------------|---------------|
| Database | AES-256 (RDS) | AWS KMS (customer-managed keys available) |
| File storage | AES-256 (S3 SSE-KMS) | AWS KMS |
| Backups | AES-256 | AWS KMS |
| Secrets | AES-256 | AWS Secrets Manager |
| API keys | AES-256 | HashiCorp Vault |

### In Transit

| Connection | Protocol | Certificate |
|------------|----------|-------------|
| Browser ↔ LeadReach | TLS 1.3 | DigiCert EV |
| API ↔ LeadReach | TLS 1.3 | DigiCert |
| LeadReach ↔ CRM | TLS 1.3 | Platform-managed |
| LeadReach ↔ Data Providers | TLS 1.3 | Provider-managed |
| Internal services | mTLS | Internal CA |

## 3. Access Control

### Authentication

| Method | Support | MFA |
|--------|---------|-----|
| Email + Password | Yes | Required |
| Google SSO | Yes | Inherited |
| Microsoft SSO | Yes | Inherited |
| SAML 2.0 | Yes (Enterprise) | Inherited from IdP |
| API Keys | Yes | N/A (scoped access) |

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| Admin | Full access, user management, billing |
| Sales Manager | Team pipeline, reports, agent config |
| SDR | Own pipeline, outreach, contacts |
| Marketing | Campaigns, templates, analytics (read) |
| Analyst | Read-only analytics and reports |
| API User | Programmatic access (scoped) |

### Data Access Policies

- Row-level security: Users see only their team's data
- Column-level masking: PII hidden from non-privileged roles
- API scope limiting: Tokens scoped to specific operations
- Audit logging: All data access recorded

## 4. Compliance Certifications

### SOC 2 Type II

- Audit period: Annual
- Auditor: Independent CPA firm
- Trust Service Criteria: Security, Availability, Confidentiality
- Report available under NDA

### GDPR Compliance

| Requirement | Implementation |
|-------------|---------------|
| Lawful basis | Legitimate interest for B2B; consent where required |
| Data minimization | Collect only necessary data fields |
| Right to access | Self-service data export |
| Right to deletion | 30-day deletion SLA |
| Data portability | JSON/CSV export |
| DPO | Designated DPO available |
| DPIA | Conducted for AI processing |
| International transfers | Standard Contractual Clauses |

### Additional Compliance

| Standard | Status | Scope |
|----------|--------|-------|
| CCPA/CPRA | Compliant | California resident data |
| CAN-SPAM | Compliant | All outbound email |
| CASL | Compliant | Canadian prospects |
| PECR | Compliant | UK/EU email |
| ISO 27001 | In progress | Expected Q4 2026 |

## 5. Incident Response

### Response SLA

| Severity | Definition | Response Time | Resolution Target |
|----------|-----------|---------------|-------------------|
| P1 Critical | Data breach, service down | 15 min | 4 hours |
| P2 High | Security vulnerability, degraded | 1 hour | 8 hours |
| P3 Medium | Non-critical security issue | 4 hours | 24 hours |
| P4 Low | Security improvement | 24 hours | 5 business days |

### Notification Policy

- P1: Immediate notification to affected customers + CISO
- P2: Notification within 4 hours to affected customers
- P3: Included in monthly security update
- GDPR breach notification: Within 72 hours to supervisory authority

## 6. Data Residency

| Region | Data Center | Available |
|--------|-------------|-----------|
| United States | AWS us-east-1 | Yes |
| European Union | AWS eu-west-1 (Ireland) | Yes |
| Asia Pacific | AWS ap-southeast-1 | Q3 2026 |

### Data Processing Controls

- Customer data stays in selected region
- No cross-region replication without consent
- Backup data encrypted and region-locked
- AI model training: customer data not used for model improvement
- Data isolation: Multi-tenant with logical separation

## 7. Vulnerability Management

| Activity | Frequency | Tool |
|----------|-----------|------|
| Penetration testing | Quarterly | Third-party firm |
| Vulnerability scanning | Weekly | Qualys |
| Dependency scanning | Per build | Snyk |
| Code review | Every PR | Manual + Semgrep |
| Bug bounty | Continuous | HackerOne |

## 8. Audit Trail

All significant actions are logged:

| Event Category | Examples | Retention |
|----------------|----------|-----------|
| Authentication | Login, logout, MFA, SSO | 1 year |
| Data access | View contact, export report | 1 year |
| Data modification | Create/update/delete records | 2 years |
| Configuration | Agent settings, RBAC changes | 2 years |
| Integration | CRM sync, webhook events | 1 year |
| Security | Failed login, API key rotation | 2 years |
