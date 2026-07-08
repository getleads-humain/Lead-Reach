---
title: "Dual-Use Technology and Export Controls for AI Sales Tools"
category: compliance
grade: A
last_reviewed: 2026-07-08
tags: [export-controls, ear, itar, dual-use, encryption, sanctions, ofac, deemed-export, saas, ai-export]
---

# Dual-Use Technology and Export Controls for AI Sales Tools

## 1. Overview: Why Export Controls Matter for SaaS AI Platforms

Export control regulations restrict the transfer of certain technologies, software, and information to foreign persons and countries. While traditionally associated with defense and military technology, **modern export controls increasingly target AI, machine learning, and encryption technologies** — all of which are core to LeadReach's platform.

### Why LeadReach Must Care

| Factor | Relevance to LeadReach |
|--------|----------------------|
| AI/ML models may qualify as dual-use technology | LeadReach's scoring, content generation, and research AI could be subject to controls |
| Encryption is fundamental to the platform | TLS, AES-256, key management — all subject to encryption export controls |
| Global customer base | Selling to or providing access from sanctioned/embargoed countries is illegal |
| Remote workforce | Employees in foreign countries may trigger "deemed export" rules |
| Cloud delivery model | SaaS access from restricted countries may constitute an export |
| Customer data includes foreign nationals | Processing data of sanctioned individuals is prohibited |

### Potential Penalties

| Violation Type | Civil Penalty (per violation) | Criminal Penalty |
|---------------|------------------------------|-----------------|
| EAR (Export Administration Regulations) | Up to $364,992 | Up to $1M fine + 20 years imprisonment |
| ITAR (International Traffic in Arms Regulations) | Up to $1,280,076 per violation | Up to $1M fine + 20 years imprisonment |
| OFAC sanctions | Up to $356,579 per violation (varies by program) | Up to $20M fine + 30 years imprisonment |
| EU dual-use regulation | Varies by member state | Criminal penalties per national law |

## 2. Export Control Regulations Overview

### 2.1 EAR — Export Administration Regulations

The EAR (15 CFR Parts 730-774) is administered by the Bureau of Industry and Security (BIS) within the US Department of Commerce. It controls the export of "dual-use" items — goods, software, and technology that have both civilian and potential military applications.

**Key EAR concepts:**

| Concept | Definition | LeadReach Relevance |
|---------|-----------|-------------------|
| **Export** | Actual shipment or transmission of items out of the US; or release of technology/source code to a foreign national in the US | Providing SaaS access to foreign nationals; sharing source code with foreign employees |
| **Deemed export** | Release of controlled technology to a foreign national within the US | Foreign national employee accessing controlled source code |
| **Reexport** | Shipment or transmission of an item from one foreign country to another | LeadReach EU subsidiary transferring controlled technology to another foreign country |
| **Transfer** | Change in end-use or end-user of an item within a foreign country | Customer using LeadReach for purposes not authorized in license |
| **Commerce Control List (CCL)** | List of items subject to EAR control, organized by Export Control Classification Number (ECCN) | LeadReach's AI and encryption technology may appear on the CCL |

### 2.2 CCL Categories Relevant to LeadReach

| Category | ECCN Range | Description | LeadReach Relevance |
|----------|-----------|-------------|-------------------|
| **Category 3 — Electronics** | 3A001-3E002 | Integrated circuits, signal processing | Potential: AI acceleration hardware (if providing) |
| **Category 4 — Computers** | 4A001-4E001 | Computers, related equipment, software | Potential: High-performance computing for AI training |
| **Category 5 — Telecommunications & Information Security** | 5A002-5E002 | Telecommunications equipment; encryption | **High relevance**: Encryption in LeadReach platform |
| **Category 6 — Sensors and Lasers** | 6A001-6E003 | Sensors, cameras, lasers | Low relevance |
| **Category 9 — Propulsion Systems** | 9A001-9E003 | Aerospace, marine propulsion | No relevance |

**Category 5 Part 2 (Information Security) is the most directly relevant** to LeadReach, covering encryption software and technology.

### 2.3 ITAR — International Traffic in Arms Regulations

ITAR (22 CFR Parts 120-130) is administered by the Department of State, Directorate of Defense Trade Controls (DDTC). It controls the export of defense articles, defense services, and related technical data on the US Munitions List (USML).

**LeadReach ITAR applicability:**

| Factor | Assessment |
|--------|-----------|
| Does LeadReach manufacture defense articles? | No |
| Does LeadReach provide defense services? | Unlikely — unless selling to defense contractors who use LeadReach for classified purposes |
| Does LeadReach handle ITAR-controlled technical data? | Only if a customer stores ITAR data in LeadReach — which must be contractually prohibited |
| Does LeadReach appear on the USML? | No — software designed for commercial sales intelligence is not on the USML |
| **Overall ITAR risk** | **Low** — but must contractually prevent customers from using LeadReach for ITAR-controlled purposes |

### 2.4 EU Dual-Use Regulation

EU Regulation 2021/821 controls the export of dual-use items from EU member states. Key updates in 2021:

- **Cyber-surveillance technology** controls added (Article 5)
- **Human rights** considerations in export licensing decisions
- **Catch-all clause** — Items not on the control list may still require a license if there's reason to believe they could be used for weapons of mass destruction or military purposes
- **Intra-EU transfer controls** for particularly sensitive items

**LeadReach EU subsidiary must comply** with this regulation when transferring technology from the EU.

## 3. Dual-Use Technology Classification for AI

### 3.1 Emerging AI Export Controls

In 2023-2025, the US government introduced new export controls specifically targeting AI and advanced computing:

| Control | Date | Description | LeadReach Impact |
|---------|------|-------------|-----------------|
| **AI chip export controls** | Oct 2022, updated Oct 2023 | Restrictions on advanced computing chips and semiconductor manufacturing equipment to China and other countries | Indirect — may affect LeadReach's cloud infrastructure choices |
| **AI model weights** | Jan 2025 (proposed/interim) | Potential controls on export of AI model weights for models trained with computing power above certain thresholds | If LeadReach's models exceed thresholds, export of weights could be controlled |
| **Cloud computing IaaS** | Jan 2025 (proposed/interim) | US cloud providers must verify identity of foreign customers; report if foreign person trains AI models that could enable malign activities | AWS must verify LeadReach; LeadReach must verify its customers |
| **AI training compute threshold** | Ongoing | Models trained with >10^25 FLOPs may face additional controls | LeadReach's models are well below this threshold |

### 3.2 ECCN Classification for LeadReach Technology

| Component | Likely ECCN | Control Reason | License Exception | Notes |
|-----------|-----------|---------------|-------------------|-------|
| **LeadReach platform (overall)** | EAR99 | Mass-market SaaS; not specifically controlled | N/A (no license required for most destinations) | Most SaaS platforms are EAR99 |
| **Encryption (TLS, AES-256)** | 5D002 | Encryption software | ENC (Encryption Commodities and Software Exception) | Mass-market encryption qualifies for ENC exception |
| **AI scoring model** | Likely EAR99 | Commercial AI for sales; not designed for military/intelligence | N/A | Must monitor for future reclassification |
| **AI content generation** | Likely EAR99 | Commercial content generation; not controlled | N/A | Must monitor for future reclassification |
| **Source code for encryption** | 5D002 | Encryption source code | May require classification request or TSU exception | Publishing source code may trigger classification requirements |
| **AI training methodology** | Likely EAR99 | Not specifically designed for controlled applications | N/A | Must document commercial-only purpose |

### 3.3 Self-Classification Process

```
LeadReach Export Classification Process
========================================

1. IDENTIFY each technology, software, and technical data item
   └──> List all components: platform, AI models, encryption, APIs, documentation

2. REVIEW the Commerce Control List (CCL)
   └──> Check each item against ECCNs in Categories 0-9

3. DETERMINE classification for each item
   ├──> If item matches an ECCN → classify under that ECCN
   ├──> If item does not match any ECCN → classify as EAR99
   └──> If uncertain → submit classification request to BIS (CCATS)

4. DETERMINE license requirements
   ├──> Check Commerce Country Chart for each destination country
   ├──> Identify reasons for control (national security, encryption items, etc.)
   └──> Determine if license exceptions apply (ENC, TSR, TMP, etc.)

5. DOCUMENT classification decisions
   └──> Maintain classification records for 5 years

6. REVIEW annually or when technology changes significantly
   └──> AI-specific controls are evolving rapidly; review quarterly
```

## 4. Deemed Export Rules for SaaS

### 4.1 What Is a Deemed Export?

A "deemed export" occurs when controlled technology or source code is **released to a foreign national within the United States**. This is "deemed" to be an export to the foreign national's home country.

**SaaS deemed export scenarios:**

| Scenario | Deemed Export? | Analysis |
|----------|---------------|----------|
| Foreign national employee accesses LeadReach EAR99 source code | No (EAR99 = no license required) | EAR99 items can be shared with any foreign national |
| Foreign national employee accesses controlled encryption source code (5D002) | Potentially yes | If encryption source code is 5D002, access by foreign national from Country Group D:1 or E:2 may require license |
| Foreign national contractor accesses AI model training methodology | Depends on classification | If methodology is EAR99, no deemed export; if classified, potentially yes |
| Customer in restricted country accesses LeadReach SaaS | Actual export (not deemed) | SaaS access from restricted country = export to that country |
| Foreign national customer support agent accesses customer data | Unlikely | Customer data is not controlled technology (unless customer is defense contractor with ITAR data) |

### 4.2 Country Groups

BIS organizes countries into groups for licensing purposes:

| Country Group | Countries | License Requirements |
|--------------|-----------|---------------------|
| **A:1** (Wassenaar Arrangement members) | UK, France, Germany, Japan, Australia, Canada, etc. | Fewest restrictions; many license exceptions available |
| **A:2** | South Korea, NATO members not in A:1 | Similar to A:1 with some additional restrictions |
| **B:1** | Taiwan, Hong Kong (with caveats) | Some restrictions; fewer license exceptions |
| **D:1** (National Security concern) | China, Russia, Venezuela, Myanmar, others | Significant restrictions; license required for many items |
| **D:2** (Nuclear concern) | Certain countries | Nuclear-related controls |
| **D:3** (Chemical/biological concern) | Certain countries | CBW-related controls |
| **D:4** (Missile technology concern) | Certain countries | Missile-related controls |
| **D:5** (US arms embargo) | Cuba, Iran, North Korea, Syria, others | Most restrictive; broad licensing requirements |
| **E:1** (Terrorist-supporting) | Cuba, Iran, North Korea, Syria | Near-total embargo |
| **E:2** (Unilateral embargo) | Varies | Unilateral US restrictions |

### 4.3 SaaS Access as Export

**Critical question:** Does providing SaaS access to a user in a foreign country constitute an "export"?

**BIS guidance (as of 2025):**

- **Access to SaaS application** — Generally, providing access to a SaaS application (where the software runs on servers in the US and users access it remotely) is considered a **use** of the software, not an export of the software itself. The software is not "transferred" to the foreign country.
- **Download of software** — If users can download client-side software, plugins, or mobile apps, that **is** an export.
- **Access to source code** — If users (including foreign nationals) can view or access controlled source code through the SaaS platform, that may be a deemed export.
- **Cloud compute for AI training** — New rules (2025) require US cloud providers to verify identity of foreign customers using IaaS for AI training.

**LeadReach policy:**

| Action | Export Control Status | Required Action |
|--------|---------------------|-----------------|
| Customer accesses LeadReach web app from foreign country | Generally not an export (use, not transfer) | Verify customer not in sanctioned country; OFAC screening |
| Customer downloads LeadReach mobile/desktop app | **Export** (software transferred to foreign country) | Classify app; check destination country; apply for license if required |
| Foreign national views controlled source code | **Deemed export** | Restrict source code access to authorized US persons or obtain license |
| Customer uses LeadReach API | Generally not an export (API access = use) | Verify customer not in sanctioned country; terms of use prohibit restricted purposes |

## 5. Encryption Export Controls

### 5.1 Overview

Encryption is one of the most heavily controlled dual-use technologies. LeadReach uses encryption extensively:

| Encryption Use | Type | ECCN | License Exception |
|---------------|------|------|-------------------|
| TLS 1.3 (in transit) | Mass-market encryption | 5D002 | ENC (mass-market) |
| AES-256 (at rest) | Symmetric encryption | 5D002 | ENC (mass-market) |
| HashiCorp Vault (key management) | Key management software | 5D002 | ENC |
| End-to-end encrypted customer data | Symmetric + asymmetric | 5D002 | ENC |
| Database encryption (PostgreSQL TDE) | Symmetric encryption | 5D002 | ENC (mass-market) |
| SSH keys for infrastructure access | Asymmetric encryption | 5D002 | ENC |

### 5.2 Encryption License Exception (ENC)

The ENC license exception (15 CFR 740.17) allows export of encryption items to most countries without an individual license, provided certain conditions are met:

| ENC Category | Requirements | LeadReach Compliance |
|-------------|-------------|---------------------|
| **Mass-market encryption** (retail) | Encryption designed for general public; functionality cannot be easily changed; published specifications | LeadReach's TLS and AES-256 qualify; submit semi-annual reports to BIS |
| **Encryption components** | Review by BIS; 30-day waiting period; classification request | May apply to custom encryption implementations |
| **Encryption source code** | Publicly available source code; or classification + license | If publishing encryption source code, must notify BIS |

### 5.3 Encryption Classification Request Requirements

When encryption items don't qualify for the mass-market exception:

1. **Submit classification request** (CCATS) to BIS
2. **Wait for review** (typically 30-90 days)
3. **Receive classification** and determine license requirements
4. **Apply for license** if required for specific destinations

### 5.4 Semi-Annual Encryption Reporting

LeadReach must submit semi-annual reports to BIS for encryption items exported under ENC:

```
SEMI-ANNUAL ENCRYPTION REPORT
==============================

Reporting period: [January-June / July-December]
Company: LeadReach Inc.
Address: [Address]
Contact: [Export Compliance Officer]

Items exported under ENC:

1. Item description: TLS 1.3 encryption in LeadReach web application
   ECCN: 5D002
   License exception: ENC (mass-market)
   Quantity/units: [Number of foreign users or downloads]
   Countries: [List of countries]

2. Item description: AES-256 encryption in LeadReach data storage
   ECCN: 5D002
   License exception: ENC (mass-market)
   Quantity/units: [Number of foreign users or deployments]
   Countries: [List of countries]

[Additional items as needed]

Certification: I certify that the information provided is accurate and complete.
Signature: ______
Date: ______
```

## 6. Sanctions Screening for Prospects

### 6.1 OFAC Sanctions Overview

The Office of Foreign Assets Control (OFAC) administers US economic sanctions programs. OFAC sanctions prohibit transactions with:

- **Specially Designated Nationals and Blocked Persons (SDN List)** — Individuals and entities owned by or acting for sanctioned governments or terrorist organizations
- **Sectoral sanctions** — Certain sectors of sanctioned countries' economies (e.g., Russian financial services, energy)
- **Country-based sanctions** — Comprehensive embargoes on Cuba, Iran, North Korea, Syria, and Crimea/Donetsk/Luhansk regions of Ukraine
- **List of Foreign Sanctions Evaders (FSE)** — Entities evading sanctions
- **Non-SDN Menu-Based Sanctions (NS-MBS)** — Sectoral sanctions on specific Russian entities
- **Consolidated Screening List** — Combines multiple screening lists

### 6.2 LeadReach Sanctions Screening Requirements

**Every prospect and customer must be screened against OFAC lists before:**

- Adding them to LeadReach's database
- Sending outreach communications
- Entering into a business relationship
- Processing payments
- Providing platform access

### 6.3 Screening Process

```python
# LeadReach OFAC Screening Process (Pseudocode)

class SanctionsScreener:
    """
    Screen prospects and customers against OFAC and other sanctions lists.
    Must be run before any business interaction.
    """
    
    # Lists to check (updated daily)
    SCREENING_LISTS = [
        "SDN",           # Specially Designated Nationals
        "FSE",           # Foreign Sanctions Evaders
        "NS-MBS",        # Non-SDN Menu-Based Sanctions
        "DPL",           # Denied Persons List (BIS)
        "UEE",           # Unverified End-Users (BIS)
        "EL",            # Entity List (BIS)
        "UVL",           # Unverified List (BIS)
        "EU_SANCTIONS",  # EU Consolidated Sanctions List
        "UK_SANCTIONS",  # UK OFSI Sanctions List
        "UN_SANCTIONS",  # UN Security Council Consolidated List
    ]
    
    def screen_prospect(self, prospect_data: dict) -> dict:
        """
        Screen a prospect against all applicable sanctions lists.
        Returns screening result with match status and confidence.
        """
        screening_results = {}
        
        # 1. Exact match screening (name, email, company)
        for list_name in self.SCREENING_LISTS:
            matches = self._check_list(
                list_name=list_name,
                name=prospect_data.get("full_name"),
                company=prospect_data.get("company_name"),
                email=prospect_data.get("email"),
                country=prospect_data.get("country"),
                additional_identifiers={
                    "date_of_birth": prospect_data.get("date_of_birth"),
                    "nationality": prospect_data.get("nationality"),
                    "passport_number": prospect_data.get("passport_number"),
                }
            )
            screening_results[list_name] = matches
        
        # 2. Fuzzy matching (for name variations)
        for list_name in self.SCREENING_LISTS:
            fuzzy_matches = self._fuzzy_check(
                list_name=list_name,
                name=prospect_data.get("full_name"),
                threshold=0.85  # 85% similarity threshold
            )
            if fuzzy_matches:
                screening_results[f"{list_name}_fuzzy"] = fuzzy_matches
        
        # 3. Company screening (beneficial ownership)
        company_screening = self._screen_company(
            company_name=prospect_data.get("company_name"),
            country=prospect_data.get("country")
        )
        
        # 4. Country screening
        country_screening = self._screen_country(
            country=prospect_data.get("country"),
            region=prospect_data.get("region")  # For Crimea/Donetsk/Luhansk
        )
        
        # 5. Determine overall status
        has_exact_match = any(r.get("exact_match") for r in screening_results.values())
        has_fuzzy_match = any(r.get("fuzzy_match") for r in screening_results.values())
        is_sanctioned_country = country_screening.get("is_sanctioned", False)
        is_sanctioned_company = company_screening.get("is_sanctioned", False)
        
        if has_exact_match or is_sanctioned_country or is_sanctioned_company:
            status = "BLOCKED"
        elif has_fuzzy_match:
            status = "REQUIRES_MANUAL_REVIEW"
        else:
            status = "CLEAR"
        
        # 6. Audit log
        AuditLog.record(
            action="sanctions_screening",
            prospect_id=prospect_data.get("id"),
            status=status,
            lists_checked=self.SCREENING_LISTS,
            timestamp=datetime.utcnow()
        )
        
        return {
            "prospect_id": prospect_data.get("id"),
            "screening_status": status,
            "screening_results": screening_results,
            "country_screening": country_screening,
            "company_screening": company_screening,
            "screened_at": datetime.utcnow(),
            "lists_checked": self.SCREENING_LISTS,
            "next_screening_due": datetime.utcnow() + timedelta(days=30)
        }
```

### 6.4 Screening Frequency

| Entity Type | Screening Frequency | Trigger Events |
|------------|-------------------|---------------|
| **Prospects** | Before first outreach; then every 30 days | First contact; major list updates; contract renewal |
| **Customers** | Before contract signing; then every 30 days | New contract; renewal; list updates; beneficial ownership change |
| **Vendors** | Before onboarding; then every 90 days | Onboarding; renewal; list updates |
| **Employees** | Before hiring; then annually | Hire; list updates; role change to export-controlled work |
| **Partners** | Before partnership; then every 90 days | Partnership agreement; renewal; list updates |

### 6.5 Sanctions Screening Response Actions

| Screening Result | Required Action | Escalation |
|-----------------|----------------|-----------|
| **BLOCKED** | Immediately block all contact; add to internal deny list; do not process any transactions; do not provide platform access | Legal + Export Compliance Officer |
| **REQUIRES_MANUAL_REVIEW** | Pause all outreach; escalate for manual review within 24 hours; do not contact until cleared | Export Compliance Officer |
| **CLEAR** | Proceed with normal business | No escalation needed |
| **Country risk — high** | Enhanced due diligence; Legal review before any business relationship | Legal + Export Compliance Officer |

## 7. OFAC Compliance Program

### 7.1 Five Pillars of OFAC Compliance

| Pillar | Description | LeadReach Implementation |
|--------|-------------|------------------------|
| **Management commitment** | Senior management commits to OFAC compliance; allocates resources | CEO and CLO sign off on sanctions policy; compliance budget |
| **Risk assessment** | Identify OFAC risk based on customers, products, geography | Annual OFAC risk assessment; customer base analysis; geographic risk map |
| **Internal controls** | Policies, procedures, and processes to prevent violations | Sanctions screening; transaction review; customer onboarding controls; geofencing |
| **Testing and auditing** | Regular testing of OFAC compliance program | Quarterly testing of screening system; annual independent audit; sample transaction review |
| **Training** | Regular OFAC compliance training for relevant personnel | Annual training for all employees; enhanced training for sales, finance, and compliance |

### 7.2 OFAC Risk Assessment for LeadReach

| Risk Factor | Level | Justification | Mitigation |
|------------|-------|---------------|-----------|
| Customer geography | Medium | Global customer base; some customers in higher-risk jurisdictions | Screening at onboarding; geofencing for sanctioned countries |
| Product offering | Low-Medium | SaaS platform for sales intelligence; not inherently high-risk for sanctions | Contractual prohibitions on use for sanctioned purposes |
| Transaction volume | Medium | High volume of small transactions (subscriptions) | Automated screening; batch processing |
| Payment methods | Low | Primarily credit card and ACH; no cryptocurrency | Payment processor has its own OFAC screening |
| Foreign nationals | Medium | Employees and contractors in multiple countries | Employee screening; deemed export controls |
| Industry sectors | Medium | Some customers in defense, energy, finance (higher OFAC risk sectors) | Enhanced screening for higher-risk industry sectors |

### 7.3 Prohibited Activities Checklist

LeadReach must **never**:

- [ ] Sell or provide platform access to any person or entity on the SDN list
- [ ] Sell or provide platform access to any person or entity in comprehensively sanctioned countries (Cuba, Iran, North Korea, Syria, Crimea/Donetsk/Luhansk regions of Ukraine)
- [ ] Process payments from or to any sanctioned person, entity, or country
- [ ] Provide platform access for purposes that would violate US sanctions (e.g., facilitating transactions with sanctioned entities)
- [ ] Export controlled technology to restricted countries without required licenses
- [ ] Allow employees or contractors from restricted countries to access controlled source code without authorization
- [ ] Facilitate circumvention of sanctions by any party
- [ ] Provide services that support weapons proliferation

## 8. Export Compliance for LeadReach by Agent

### 8.1 Atlas (Intent Classification)
- Flag any intent involving prospects in sanctioned countries for OFAC review
- Classify intents with awareness that certain end-uses (military, weapons proliferation) are prohibited
- Log classification decisions for export compliance audit trail

### 8.2 Scout (Research)
- **Never** research or collect data about individuals on OFAC lists
- Screen prospects against sanctions lists before adding to database
- Block research for prospects in comprehensively sanctioned countries
- Log all screening results with timestamps

### 8.3 Forge (Enrichment)
- Screen enrichment data against sanctions lists before incorporating
- Flag any enrichment data indicating sanctioned country, entity, or individual
- Do not enrich prospects who fail sanctions screening
- Document the source of all enrichment data for compliance audit

### 8.4 Judge (Scoring)
- Do not score prospects who are blocked by sanctions screening
- Ensure scoring does not disadvantage prospects based on national origin (protected characteristic)
- Flag high-value prospects in high-risk jurisdictions for enhanced due diligence
- Log scoring decisions for export compliance audit trail

### 8.5 Bard (Content Generation)
- **Never** generate content for prospects who are blocked by sanctions screening
- Do not generate content targeting individuals in sanctioned countries
- Ensure outreach does not offer services that could violate export controls
- Include export compliance disclaimers where required

### 8.6 Flow (Campaign Orchestration)
- **Check sanctions status before every outreach action** — no exceptions
- Geofence campaigns to exclude sanctioned countries and regions
- Block email delivery to domains associated with sanctioned entities
- Implement real-time OFAC list checking in campaign workflow
- Audit log all sanctions checks and decisions

### 8.7 Echo (Analytics and Reporting)
- Exclude blocked/sanctioned prospects from all reports
- Report on sanctions screening metrics (volume, match rates, resolution times)
- Support OFAC compliance audits with data and documentation
- Flag any anomalies suggesting sanctions circumvention attempts

## 9. Export Compliance Documentation

### 9.1 Required Documentation

| Document | Purpose | Retention | Owner |
|----------|---------|-----------|-------|
| Export classification records | Document classification decisions for each technology item | 5 years | Export Compliance Officer |
| License applications and approvals | Record of any export license applications | 5 years after license expires | Export Compliance Officer |
| Sanctions screening records | Record of all screening checks and results | 5 years | Compliance Team |
| Denied party records | Internal list of blocked/denied parties | 5 years after last action | Compliance Team |
| Encryption semi-annual reports | BIS reporting for ENC exception | 5 years | Export Compliance Officer |
| Training records | Employee and contractor export compliance training | Duration of employment + 3 years | HR + Compliance |
| Deemed export assessments | Assessment of deemed export risk for foreign national access | 5 years | Export Compliance Officer + Legal |
| Customer end-use certificates | Customer certifications of authorized end-use | Duration of relationship + 5 years | Legal |
| Audit reports | Internal and external audit of export compliance program | 5 years | Compliance Team |

### 9.2 Export Compliance Policy Statement

```
LEADREACH EXPORT COMPLIANCE POLICY
====================================

LeadReach Inc. is committed to full compliance with all applicable 
export control and sanctions laws, including:

- The Export Administration Regulations (EAR)
- The International Traffic in Arms Regulations (ITAR)
- Office of Foreign Assets Control (OFAC) sanctions programs
- EU Dual-Use Regulation (Regulation 2021/821)
- All other applicable export control and sanctions laws

It is the policy of LeadReach that:

1. No export, reexport, or transfer of controlled items will occur 
   without the required government authorizations.

2. No transactions will be conducted with sanctioned or embargoed 
   countries, entities, or individuals.

3. All employees and contractors will receive export compliance 
   training appropriate to their role.

4. Violations of export control laws will result in disciplinary 
   action, up to and including termination.

5. Suspected violations must be reported immediately to the 
   Export Compliance Officer or through the compliance hotline.

6. All export-related decisions must be documented and retained 
   for the required period.

Approved by: [CEO]
Date: [Date]
Export Compliance Officer: [Name]
```

## 10. Compliance Checklist: Export Controls and Sanctions

### Customer/Prospect Onboarding

- [ ] Sanctions screening completed against all applicable lists (OFAC, EU, UK, UN)
- [ ] Country risk assessment completed
- [ ] End-use certification obtained (if required by classification)
- [ ] Customer not located in comprehensively sanctioned country
- [ ] Customer not on any denied party or blocked person list
- [ ] Customer's intended use of LeadReach does not violate export controls
- [ ] Customer contract includes export compliance clause
- [ ] Screening results documented and retained

### Platform Access

- [ ] Geofencing implemented for sanctioned countries (IP-based blocking)
- [ ] Access controls restrict controlled source code to authorized personnel
- [ ] Foreign national access to controlled technology assessed (deemed export)
- [ ] Encryption classification confirmed and ENC exception documented
- [ ] Semi-annual encryption reports filed with BIS

### Employee/Contractor

- [ ] All employees screened against sanctions lists before hire
- [ ] Foreign national access to controlled technology assessed
- [ ] Deemed export analysis completed for foreign national employees
- [ ] Export compliance training completed (annual)
- [ ] Enhanced training for employees in export-controlled roles

### Ongoing Monitoring

- [ ] Sanctions lists monitored for updates (daily)
- [ ] Rescreening of customers/prospects on regular schedule (30/90 days)
- [ ] Transaction monitoring for suspicious patterns
- [ ] Export classification review (annually or when technology changes)
- [ ] Compliance program audit (annually)
- [ ] Regulatory updates review (monthly)

### AI-Specific Monitoring

- [ ] AI model classification reviewed against evolving controls
- [ ] AI model weights access restricted as appropriate
- [ ] Cloud computing compliance (customer identity verification for AI training)
- [ ] AI end-use monitoring (ensure customers don't use LeadReach AI for prohibited purposes)
- [ ] New AI export control regulations tracked and assessed

## 11. Country-Specific Quick Reference

### 11.1 Comprehensive Sanctions (Near-Total Prohibition)

| Country/Region | OFAC Program | Key Restrictions | LeadReach Action |
|---------------|-------------|-----------------|-----------------|
| **Cuba** | CACR | Comprehensive embargo; most transactions prohibited | Block all access; no sales; no outreach |
| **Iran** | ITR | Comprehensive embargo; most transactions prohibited | Block all access; no sales; no outreach |
| **North Korea (DPRK)** | NKSR | Comprehensive embargo; all transactions prohibited | Block all access; no sales; no outreach |
| **Syria** | SSR | Comprehensive embargo; most transactions prohibited | Block all access; no sales; no outreach |
| **Crimea/Donetsk/Luhansk (Ukraine)** | UKRAINE-EO | Comprehensive sanctions; most transactions prohibited | Block all access; no sales; no outreach |

### 11.2 Sectoral/Targeted Sanctions (Partial Prohibition)

| Country | OFAC Program | Restricted Sectors | LeadReach Action |
|---------|-------------|-------------------|-----------------|
| **Russia** | RUSSIA-EO | Financial services, energy, defense, luxury goods | Screen all Russian entities; enhanced due diligence; block SDN-listed entities |
| **Belarus** | BELARUS | Defense, energy, potash, tobacco | Screen all Belarus entities; block SDN-listed entities |
| **Venezuela** | VENEZUELA | Government-related entities; oil sector; gold | Screen all Venezuelan entities; block SDN-listed entities |
| **Myanmar** | BURMA | Military-related entities; specific sectors | Screen all Myanmar entities; block SDN-listed entities |
| **China (specific entities)** | Various | Military end-use; surveillance; AI for human rights abuses | Screen all Chinese entities; block military-intelligence entities; verify end-use |

### 11.3 High-Risk but Not Sanctioned

| Country | Risk Level | LeadReach Action |
|---------|-----------|-----------------|
| **China (general)** | High | Enhanced due diligence; export classification review; end-use verification; deemed export assessment for Chinese national employees |
| **Turkey** | Medium | Standard screening; monitor for designation changes |
| **UAE** | Medium | Standard screening; monitor for re-export of controlled items |
| **Saudi Arabia** | Medium | Standard screening; end-use verification for AI technology |
| **India** | Low-Medium | Standard screening; standard export classification |

---

*This document is a living reference. Last reviewed: 2026-07-08. Next review: 2026-10-08. All LeadReach agents must follow these export control and sanctions guidelines. When in doubt, escalate to the Export Compliance Officer or Legal. Violations of export control laws carry severe criminal and civil penalties.*
