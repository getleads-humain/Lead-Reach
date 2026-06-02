# Security

> **Note**: This document covers vulnerability reporting and responsible disclosure. For the comprehensive enterprise-grade security policy, see [SECURITY_POLICY.md](./SECURITY_POLICY.md).

## Vulnerability Reporting

We take the security of LeadReach seriously. If you believe you have found a security vulnerability, we encourage you to report it responsibly.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following channels:

- **Email**: security@leadreach.ai
- **HackerOne**: [https://hackerone.com/leadreach](https://hackerone.com/leadreach) (if available)

### What to Include

When reporting a vulnerability, please include:

1. **Description** of the vulnerability and its potential impact
2. **Steps to reproduce** the issue (detailed and specific)
3. **Affected components** (URLs, endpoints, features)
4. **Proof of concept** (if available)
5. **Your contact information** for follow-up

### Our Commitment

- We will acknowledge receipt of your report within **24 hours**
- We will provide a detailed response within **72 hours** with our assessment and planned timeline
- We will keep you informed of our progress throughout the remediation process
- We will credit you in our security advisories (unless you prefer to remain anonymous)

### Responsible Disclosure Guidelines

- **Do not** access, modify, or delete other users' data
- **Do not** degrade system performance or availability
- **Do not** publicly disclose the vulnerability before we have remediated it
- **Do** allow us a reasonable time (90 days) to address the issue before public disclosure
- **Do** test only against accounts you own or have explicit permission to test

### Scope

**In Scope:**
- All LeadReach web applications and APIs
- Authentication and authorization mechanisms
- Data handling and storage systems
- AI agent execution environments

**Out of Scope:**
- Social engineering attacks
- Physical attacks
- Denial of Service (DoS/DDoS) attacks
- Third-party services not operated by LeadReach (report to the respective vendor)

### Bug Bounty Program

We offer monetary rewards for valid security vulnerabilities:

| Severity | Reward Range |
|----------|-------------|
| Critical | $1,000 - $5,000 |
| High | $500 - $2,000 |
| Medium | $200 - $750 |
| Low | $50 - $200 |

Rewards are determined at our discretion based on severity, impact, and report quality.

---

**Last updated**: June 2, 2026
