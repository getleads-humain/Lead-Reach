# Security Policy

## Supported Versions

We actively support the following versions of LeadReach AI with security updates:

| Version | Supported | Status |
| ------- | --------- | ------ |
| 0.2.x | :white_check_mark: | Active development |
| < 0.2 | :x: | End of life |

> **Note**: LeadReach AI is currently in active development (pre-1.0). Breaking changes and security-related architectural updates may occur between minor versions. We recommend always running the latest version.

---

## Reporting a Vulnerability

### Do NOT Report Security Vulnerabilities Through Public GitHub Issues

Security vulnerabilities must be reported privately to give us time to fix the issue before it becomes publicly known. Public disclosures put all users at risk.

### How to Report

**Preferred method — Email:**

Send a detailed report to [security@leadreach.ai](mailto:security@leadreach.ai). Include the following information:

1. **Type of vulnerability** (e.g., XSS, SQL injection, authentication bypass, data exposure, privilege escalation)
2. **Affected component(s)** (e.g., API route, authentication flow, database layer, specific page)
3. **Step-by-step reproduction** instructions
4. **Proof of concept** or exploit code (if available)
5. **Impact assessment** — what an attacker could achieve
6. **Your suggested fix** (optional, but appreciated)

**Alternative — GitHub Security Advisories:**

You may also report vulnerabilities through [GitHub Security Advisories](https://github.com/getleads-humain/Lead-Reach/security/advisories/new). This allows us to collaborate on a fix privately before publishing the advisory.

### What to Expect

| Step | Timeline |
|------|----------|
| Acknowledgment of your report | Within 24 hours |
| Initial assessment and triage | Within 3 business days |
| Status update on investigation | Within 7 business days |
| Fix development and testing | Varies by severity and complexity |
| Security advisory published | After fix is released |

### Severity Classification

We use the following severity levels based on CVSS v3.1 scoring:

| Severity | CVSS Score | Examples |
|----------|-----------|---------|
| **Critical** | 9.0 – 10.0 | Remote code execution, database credential exposure, authentication bypass |
| **High** | 7.0 – 8.9 | SQL injection, stored XSS with session hijacking, privilege escalation |
| **Medium** | 4.0 – 6.9 | Reflected XSS, CSRF, information disclosure of non-sensitive data |
| **Low** | 0.1 – 3.9 | Minor information leaks, UI spoofing, low-impact misconfigurations |

---

## Security Architecture

### Data Protection

- **Encryption at rest**: All stored data is encrypted using AES-256 encryption in our Supabase PostgreSQL database
- **Encryption in transit**: All client-server communication uses TLS 1.3
- **Secrets management**: API keys, database credentials, and other secrets are stored as environment variables and never committed to the repository
- **PII handling**: Personal information is handled in compliance with GDPR and CCPA requirements

### Authentication and Authorization

- **Session management**: Handled via NextAuth.js with secure, HTTP-only cookies
- **Row-level security**: Supabase Row Level Security (RLS) policies ensure tenant isolation
- **API authentication**: All API routes require valid session tokens
- **Role-based access**: User roles and permissions are enforced at both the API and UI levels

### AI Agent Security

- **Agent isolation**: AI agents process data in isolated, secure environments with no cross-tenant data access
- **Guardrails**: Agent actions are constrained by configurable guardrails and approval workflows
- **Audit logging**: All agent operations are logged for security review and compliance
- **Data scope**: AI agents only access data that the user has explicitly authorized

### Infrastructure

- **Cloud provider**: SOC 2 Type II certified infrastructure
- **Access controls**: Strict role-based access controls for production systems
- **Monitoring**: 24/7 security monitoring and alerting
- **Incident response**: Comprehensive incident response plan with 72-hour notification commitment

---

## Known Security Considerations

### Third-Party Dependencies

LeadReach AI relies on third-party packages. We regularly audit our dependencies for known vulnerabilities using `npm audit` and Dependabot. If you discover a vulnerability in a dependency we use, please report it through the channels above.

### AI Model Outputs

AI-generated content (lead enrichment, outreach messages, etc.) may occasionally produce unexpected or inaccurate results. We implement multiple safeguards, but users should always review AI-generated outputs before acting on them. The AI models we use do not train on customer data.

### Lead Data Collection

Our AI agents collect publicly available information from authorized sources. We comply with each platform's terms of service and robots.txt directives. If you believe our agents are accessing data they should not, please report it immediately.

---

## Responsible Disclosure Policy

We are committed to working with the security community to verify and address potential vulnerabilities. We ask that you:

1. **Do not access or modify** other users' data without their explicit consent
2. **Do not degrade** the availability of our services (no DDoS, resource exhaustion, etc.)
3. **Do not publicly disclose** the vulnerability until we have had a reasonable time to address it
4. **Provide us with reasonable time** to fix the issue before any public disclosure (minimum 90 days)
5. **Act in good faith** to protect user data and privacy

### Safe Harbor

We will not pursue legal action against security researchers who:

- Discover and report vulnerabilities in good faith
- Avoid privacy violations, data destruction, and service disruption
- Comply with this responsible disclosure policy
- Do not exploit the vulnerability for personal gain or to harm others

---

## Bug Bounty

We are currently evaluating the launch of a formal bug bounty program. In the meantime, we deeply appreciate responsible disclosure and will publicly acknowledge researchers who report valid security issues (with their permission).

---

## Security Contact

| Role | Contact |
|------|---------|
| Security Team | [security@leadreach.ai](mailto:security@leadreach.ai) |
| Data Protection Officer | [dpo@leadreach.ai](mailto:dpo@leadreach.ai) |
| General Inquiries | [hello@leadreach.ai](mailto:hello@leadreach.ai) |

---

## Policy Updates

This security policy was last updated on January 15, 2026. We may update this policy from time to time. Significant changes will be communicated through our GitHub repository and website.

---

*Thank you for helping keep LeadReach AI and our users safe.*
