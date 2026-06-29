---
title: "Canada — B2B Lead Intelligence & Compliance Guide"
slug: region-canada
category: region
tags: [canada, casl, pipeda, quebec-law-25, b2b, north-america, alberta-pipa, bc-pipa]
agents: [atlas, scout, forge, sage, judge, bard]
regions: [canada, ca, north-america]
intent_types: [research_company, build_icp, compose_outreach, find_suppliers]
priority: 82
version: 2
lastReviewed: "2026-06-30"
author: LeadReach Knowledge Engineering
summary: "Regional B2B prospecting guide for Canada. Federal vs provincial jurisdiction, CASL, PIPEDA, Quebec Law 25, provincial corporate registries, bilingual requirements, major hubs, and cultural norms."
---

# Canada — B2B Lead Intelligence & Compliance Guide

## Regional Overview

Canada is the world's tenth-largest economy (~$2.2T GDP, 2025) and the second-largest B2B outbound market in North America, with a sophisticated but more concentrated buyer ecosystem than the United States. The country's 39M population is clustered along the southern border within 160 km of the US, creating dense urban corridors — the Quebec City–Windsor corridor (Toronto, Montreal, Ottawa, Quebec City) holds over 50% of the national population, while Vancouver and Calgary anchor the western economy. Canada's business culture is deeply intertwined with the US through the USMCA (United States–Mexico–Canada Agreement, effective 2020, replacing NAFTA) — cross-border trade accounts for ~60% of Canada's GDP, and most mid-market and enterprise Canadian companies maintain US-facing operations. This creates a unique B2B environment: buyers are familiar with US SaaS products, pricing models, and sales motions, but operate under stricter privacy and anti-spam regulations (CASL, PIPEDA, Quebec Law 25) that materially change the compliance calculus for outbound.

The Canadian B2B market is characterized by longer sales cycles (45–120 days for SaaS, 20–40% longer than the US), lower ACVs (15–25% below US levels for comparable buyer profiles), and a strong preference for data residency within Canadian borders — a sensitivity amplified by the US CLOUD Act and Patriot Act concerns. Digital maturity is high: internet penetration exceeds 95%, LinkedIn adoption among knowledge workers is ~62%, and cloud infrastructure is well-established with AWS ca-central-1 (Montreal), Azure Canada Central (Toronto), and Google Cloud Montreal region. The market is accessible for US-based vendors but demands deliberate compliance design and localization, particularly for Quebec (French-language requirements under Bill 96) and for regulated industries (banking under OSFI, healthcare under provincial health authorities, defense under ITSA).

LeadReach treats Canada as a tier-1 expansion market — easier to enter than the EU (no GDPR, shared language and culture), more regulated than the US (CASL is materially stricter than CAN-SPAM), and high cultural fit with US GTM playbooks with modest adaptation. The key differentiator for LeadReach is compliance-aware prospecting: Scout identifies Canadian accounts with high-intent signals, Forge enriches with province-level and language-preference data, Sage researches the specific compliance context (CASL, PIPEDA, Quebec Law 25, sector-specific), Bard composes bilingual-aware outreach, and Judge scores accounts by Canadian-fit (data residency needs, language, regulatory burden).

**Key facts**:
- **GDP**: ~$2.2T CAD (~$1.8T USD, 2025)
- **Population**: ~39.5M; ~72% within 160 km of US border
- **Currency**: CAD (Canadian Dollar, floating; closely correlated with USD at ~$0.72–0.77 USD)
- **Government**: Federal parliamentary constitutional monarchy — 10 provinces, 3 territories; **critical for compliance: federal and provincial jurisdictions overlap in privacy, corporate registration, and consumer protection**
- **Languages**: English (58% first language), French (22%, concentrated in Quebec); 200+ languages spoken in Toronto alone
- **Time zones**: EST (UTC−5, Toronto, Montreal, Ottawa), CST (UTC−6, Winnipeg, Saskatchewan), MST (UTC−7, Calgary, Edmonton), PST (UTC−8, Vancouver); most observe daylight saving (except Saskatchewan, parts of BC)
- **Internet penetration**: ~95%; mobile penetration ~89%
- **Business centers**: Toronto (finance, SaaS), Montreal (AI, gaming, life sciences), Vancouver (gaming, DevTools, clean tech), Calgary (energy, ag tech), Ottawa (gov-tech, defense, telecom), Waterloo (SaaS, fintech, insurtech)

## Business Registration Infrastructure

Canada's business registration system is **decentralized across provinces and territories**, with a federal overlay — there is no single national corporate registry analogous to the UK's Companies House or Australia's ASIC. This fragmentation is the single most important structural fact for B2B data enrichment in Canada: LeadReach's Forge and Scout agents must navigate multiple registries to verify company existence, status, directors, and financials.

### Federal Registry — Innovation, Science and Economic Development Canada (ISED)

- **Corporations Canada** (operating under ISED): Registers federal corporations under the Canada Business Corporations Act (CBCA). Federal incorporation allows a company to operate under the same corporate name across all provinces without extra-provincial registration (though business licensing may still be required provincially).
- **NUANS (Newly Upgraded Automated Name Search)**: Required name search before federal or most provincial incorporations; ensures name uniqueness.
- **Federal corporation search**: Available online at `ised-isde.canada.ca/cc/lgcl-fd129-eng.html` — free basic search (corporation name, number, status, registered office address); paid for detailed corporate extracts.
- **Corporation number**: Federal corporations receive a 6-digit corporation number (e.g., 123456-7 with check digit); this is distinct from the BN (Business Number).
- **Publications**: Federal corporations must file Annual Returns; financial statements of distributing (public) corporations are available through SEDAR+ (System for Electronic Document Analysis and Retrieval, `sedarplus.ca`).

### Provincial Corporate Registries

Each province and territory maintains its own corporate registry under provincial business corporations acts. The largest and most commercially significant:

| Province/Territory | Registry | Access | Notes |
|---|---|---|---|
| Ontario | OBR (Ontario Business Registry) | Online, `ontario.ca/page/ontario-business-registry` | Replaced ServiceOntario in 2021; free basic search, paid for extracts |
| Quebec | REQ (Registre des entreprises du Québec) | Online, `registreentreprises.gouv.qc.ca` | Free search for basic info; detailed extracts available for fee; NEQ (Numéro d'entreprise du Québec) is the identifier |
| British Columbia | BC Registry Services | Online, `bcregistry.gov.bc.ca` | Paid search; BC corporate numbers |
| Alberta | Corporate Registry (Service Alberta) | Online via search agents; `servicealberta.ca` | Must use authorized search agents; no direct public search |
| Manitoba | Companies Office | Online, `companiesoffice.gov.mb.ca` | Limited online search |
| Saskatchewan | ISC (Information Services Corp) | Online, `isc.ca` | Paid search |
| Others | Varies | Varies | NWT, Yukon, Nunavut have small registries |

**Practical implication**: When LeadReach Forge verifies a Canadian company, it must check both the federal registry (ISED) and the relevant provincial registry. Many companies are incorporated provincially (especially smaller SMEs) and will NOT appear in the federal registry. The NEQ is essential for Quebec companies; the Ontario corporation number for Ontario entities.

### Business Number (BN) — Canada Revenue Agency (CRA)

- **BN (Business Number)**: 9-digit identifier issued by the CRA to every business for tax purposes. Format: `123456789 RT 0001` (9-digit BN + 2-letter program account identifier + 4-digit reference number). The BN is the closest Canada has to a universal business identifier.
- **BN Lookup**: Not directly searchable by the public for all businesses, but ABN-style universal lookup is available through the CRA's GST/HST registry for registered GST/HST holders.
- **GST/HST Registry**: `canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/gst-hst-registry.html` — verifies whether a business is registered for GST/HST and provides legal name, BN, and effective date.

### SEDAR+ and SEDI

- **SEDAR+** (`sedarplus.ca`): Electronic filing system for public company disclosures — prospectuses, financial statements, MD&A, material change reports. Replaced the legacy SEDAR system in 2023. Essential for due diligence on Canadian public companies and investment fund managers.
- **SEDI** (System for Electronic Disclosure by Insiders): Tracks insider trading reports for public company insiders. Merged into SEDAR+ in 2023.
- **EquityDB / TSX listings**: Toronto Stock Exchange (TSX) and TSX Venture Exchange (TSXV) listed companies are searchable via `tmx.com`.

## Regulatory & Compliance Framework

Canada's regulatory environment for B2B outreach is defined by a federal–provincial split: **federal laws (CASL, PIPEDA) set the baseline, but provinces may impose stricter requirements** (most notably Quebec Law 25, Alberta PIPA, and BC PIPA). For LeadReach, the practical rule is: **comply with the strictest applicable law** — for national B2B outreach, this means building to CASL + PIPEDA + Quebec Law 25 standards simultaneously.

### CASL — Canada's Anti-Spam Legislation (2014, amended)

CASL is materially stricter than the US CAN-SPAM Act and is the single most important compliance consideration for B2B email outreach to Canada. It applies to **all commercial electronic messages (CEMs)** sent to or from Canadian computer systems, regardless of the sender's location.

- **Consent required**: Either express (opt-in) or implied (existing business relationship / existing non-business relationship).
- **Express consent**: Must be obtained through a clear, affirmative action (checkbox, not pre-checked). Must include the purpose of consent, identity of the sender, and mailing address. Revocable at any time. No expiry — valid until withdrawn.
- **Implied consent — existing business relationship (EBR)**: Permitted for 2 years after the last purchase, inquiry, or business interaction. Expires 6 months after the last non-business interaction (e.g., a download) if no purchase.
- **Implied consent — existing non-business relationship**: Downloading content, entering a contest, or subscribing to a newsletter creates a 6-month implied consent window (2 years if the recipient made a purchase during that window).
- **Business-to-business exemption (limited)**: Section 6(6) of CASL provides a narrow exemption for CEMs sent to persons who have "conspicuously published" their contact information or disclosed it to the sender, provided the message is relevant to the recipient's business role. This exemption is narrower than many vendors assume — it requires the contact information to have been published without a statement that CEMs are not desired.
- **Identification**: Every CEM must include the sender's name, physical mailing address, and at least one of: telephone number, email address, or URL.
- **Unsubscribe mechanism**: Must be free, easy, and functional. Must be honored within 10 business days. Must include either a link or a reply-to email.
- **No false or misleading representations**: Subject lines, sender information, and URL/web links must not be deceptive.
- **Penalties**: Up to **CAD $10 million per violation** for businesses; **CAD $1 million per violation** for individuals. Personal liability for directors and officers who authorize, acquiesce in, or participate in violations. CRTC (Canadian Radio-television and Telecommunications Commission) enforcement is active — significant penalties have been issued to Komodo, Plenty of Fish, and others.
- **Private right of action**: Suspended since 2017 but could be reactivated by future legislation — this would open the door to class-action lawsuits.

> **LeadReach recommendation**: Treat all Canadian B2B outreach as if express consent is required. Use a soft opt-in (download, demo request, content unlock) before cold email. Implied consent is fragile and high-risk at scale. For cold email sequences, Bard should always include sender identification (name, address, phone/URL) and a one-click unsubscribe.

### PIPEDA — Personal Information Protection and Electronic Documents Act (2000)

PIPEDA is Canada's federal private-sector privacy law, governing the collection, use, and disclosure of personal information in the course of commercial activities. It applies to all organizations in provinces that do not have "substantially similar" provincial privacy legislation (currently, Alberta, BC, and Quebec have substantially similar laws, meaning PIPEDA does not apply to intra-provincial activities in those provinces, but does apply to inter-provincial and international activities).

- **10 Fair Information Principles** (Schedule 1): Accountability, Identifying Purposes, Consent, Limiting Collection, Limiting Use/Disclosure/Retention, Accuracy, Safeguards, Openness, Individual Access, Challenging Compliance.
- **Consent**: Meaningful, valid, documented. Must be obtained before or at the time of collection. Can be express or implied depending on sensitivity.
- **Purpose limitation**: Data can only be used for the purposes for which it was collected, unless new consent is obtained.
- **Access and correction**: Individuals can request their personal data and request corrections. Organizations must respond within 30 days.
- **Breach notification**: Mandatory since 2018 — organizations must report breaches to the OPC (Office of the Privacy Commissioner) and affected individuals when there is a "real risk of significant harm." Must be reported as soon as feasible.
- **Record keeping**: Organizations must maintain records of all breaches of security safeguards, even those not reported, for 24 months.
- **Accountability**: Must designate a privacy officer (can be an existing employee; no formal certification required under PIPEDA).
- **Penalties**: PIPEDA currently lacks Administrative Monetary Penalties (AMPs) — the OPC can investigate, recommend, and publicly name non-compliant organizations, but cannot levy fines. However, the Federal Court can award damages. PIPEDA reform proposals (Bill C-27, the Consumer Privacy Protection Act) would introduce AMPs of up to CAD $10 million or 3% of gross global revenue — monitor closely.

### Quebec Law 25 (2021–2023, fully in effect September 2024)

Quebec's Act respecting the protection of personal information is the strictest provincial privacy law in Canada and applies to any organization carrying on an enterprise in Quebec or handling Quebec residents' personal information. It is closer to GDPR in scope than PIPEDA.

- **Privacy Impact Assessment (PIA)**: Required for any new project, system, or product involving personal information. Must be documented and available to the CAI (Commission d'accès à l'information) on request.
- **Privacy officer**: Must be designated and named publicly. For public bodies, the head of the organization is the default.
- **Confidentiality**: Explicit duty of confidentiality for personal information — must not be disclosed without authorization.
- **Consent**: Must be explicit, free, informed, and specific (not bundled). Consent must be requested for each specific purpose. Consent is revocable at any time.
- **Breach notification**: Must be reported to the CAI and affected individuals "without unreasonable delay" when the breach presents a "serious risk of injury." Penalties for non-notification up to CAD $15 million or 3% of worldwide revenue.
- **Data minimization**: Only collect information that is necessary for the stated purpose.
- **Automated decision-making**: Individuals have the right to be informed of the existence of automated decision-making systems and to request that a human review the decision.
- **Cross-border transfer**: Must ensure equivalent protection when transferring personal information outside Quebec. Equivalent to GDPR's adequacy requirement in practice.
- **Penalties**: Up to **CAD $15 million** or 3% of worldwide revenue (whichever is greater) for the most serious offenses. Individuals can also seek damages.

> **LeadReach recommendation**: For any outreach targeting Quebec-based prospects, assume Quebec Law 25 applies in addition to PIPEDA and CASL. Maintain documented PIAs, designate a public privacy officer, and ensure consent mechanisms are unbundled. Bard should compose French-language outreach for Quebec prospects by default.

### Alberta PIPA (Personal Information Protection Act, 2004)

- Applies to private-sector organizations in Alberta. Substantially similar to PIPEDA — recognized as such by the federal government.
- Key differences from PIPEDA: slightly less prescriptive on consent requirements; no mandatory breach notification to a regulator (only to affected individuals where there is a "real risk of significant harm"), though Alberta's Health Information Act (HIA) has its own breach rules for health data.
- Regulator: Office of the Information and Privacy Commissioner of Alberta (OIPC Alberta).

### British Columbia PIPA (Personal Information Protection Act, 2004)

- Substantially similar to PIPEDA and Alberta PIPA. Recognized as substantially similar by the federal government.
- BC's privacy regime is notable because of the **BC Personal Information Protection Act's application to political parties** (added in 2019) and the province's strong stance on cross-border data flows (BC's Freedom of Information and Protection of Privacy Act — FIPPA — restricts storage of personal information outside Canada for public bodies).
- Regulator: Office of the Information and Privacy Commissioner for BC (OIPC BC).
- **Important**: BC public bodies (government agencies, public universities, health authorities) must store personal information in Canada — this is stricter than PIPEDA and has significant implications for selling SaaS to BC public-sector organizations.

### Other Provincial Privacy Laws

- **PHIPA** (Ontario — Personal Health Information Protection Act, 2004): Governs personal health information in Ontario. Relevant for HealthTech vendors selling to Ontario hospitals, LHINs, and health information custodians.
- **ATIPPA** (Newfoundland & Labrador), **FOIPOP** (Nova Scotia), **FIPPA** (Manitoba): Provincial freedom-of-information and privacy acts for public bodies.

### Telemarketing Rules

- **National Do Not Call List (DNCL)**: Administered by the National DNCL operator (currently Inversora). B2B calls to business numbers are generally exempt from DNCL scrub requirements, but **internal DNC lists must be maintained** and honored. DNC registration must be scrubbed every 31 days.
- **Unsolicited Telecommunications Rules (UTR)**: CRTC rules governing telemarketing — calling hours (9am–9:30pm local time), identification requirements, and DNC obligations.
- **Fax marketing**: Prohibited to numbers on the National DNCL; registration is required for telemarketers.

### USMCA Context

The USMCA (effective July 2020) replaced NAFTA and includes a digital trade chapter (Chapter 19) that:
- Prohibits customs duties on digital products.
- Ensures free cross-border data flows (with public-policy exceptions).
- Prohibits data localization requirements (with exceptions for financial services — Article 19.8.2 allows prudential measures).
- **Practical implication**: OSFI (Office of the Superintendent of Financial Institutions) can still require data residency for federally regulated financial institutions — the USMCA exception means Canadian banks can and do demand Canadian data residency.

## Cultural Business Norms

Canadian business culture is broadly similar to the US but with important nuances that affect outreach tone, relationship-building, and deal progression.

### Communication Style

- **Polite but direct**: Canadians value clarity and brevity but avoid the aggressive "always be closing" tone common in US outbound. Overly pushy CTAs ("Are you free Tuesday at 2pm?") underperform in Canada; softer CTAs ("Worth a brief call this week?") convert better.
- **Understatement over hype**: Claims like "revolutionary" or "game-changing" are viewed with skepticism. Lead with data: "reduced pipeline creation time by 40% for [Canadian reference]" over superlatives.
- **Self-deprecating humor**: Acceptable and can be effective in breaking the ice, especially in English Canada. Avoid in first-touch outreach; acceptable in follow-ups after rapport is established.
- **French-formal in Quebec**: Quebec business culture is more formal than the rest of Canada. Use "vous" (not "tu") in written French outreach until invited otherwise. Titles (Monsieur, Madame) are expected in initial communications.

### Meeting Etiquette

- **Punctuality**: Valued but with a 5-minute grace period — not as rigid as Germany or Japan.
- **Agenda-driven**: Canadians expect meetings to have a clear agenda and stick to it. "Let's grab coffee and chat" works less well than "15-minute agenda: [1] your current X process, [2] how we've helped [peer], [3] next steps."
- **Small talk**: Weather, hockey, and local references are safe icebreakers. Avoid US politics, religion, and Indigenous issues unless the prospect raises them.
- **Virtual meetings**: Post-COVID, virtual-first is the norm for initial B2B meetings. Camera-on is expected in enterprise settings.

### Decision-Making Speed

- **Slower than US, faster than Germany**: 45–120 days for SaaS B2B (mid-market: 45–75 days; enterprise: 90–120 days).
- **Consensus-seeking**: Canadian organizations tend toward consensus-based decision-making more than US organizations. Multiple stakeholders are typically involved earlier in the process.
- **Procurement formality**: Enterprise deals (especially in financial services, government, healthcare) require formal RFP/RFQ processes. Budget approval cycles are often quarterly or annual.

### Relationship Requirements

- **Reference-driven**: Canadian buyers place high value on references from other Canadian companies — US references are helpful but not as persuasive. Having 2–3 Canadian references in the same sector significantly accelerates trust.
- **Local presence**: A Canadian address, Canadian phone number, and Canadian billing entity materially improve conversion. Many Canadian buyers are sensitive to "US vendor who doesn't understand Canada."
- **Trust signals**: SOC 2 Type II, ISO 27001, and Canadian-specific certifications (PIPEDA compliance attestation, data residency in Canada) are important for enterprise deals.

### Gift-Giving

- **Modest and appropriate**: Small gifts (company swag, coffee gift cards) are acceptable. Anything perceived as lavish (>CAD $50) may violate corporate gift policies and anti-bribery legislation (Corruption of Foreign Public Officials Act for international, Canadian Criminal Code provisions for domestic).
- **Holiday gifts**: Common between established business relationships; avoid for prospects you haven't closed.

### Hierarchy

- **Flatter than expected**: Canadian organizations, particularly in tech and startup ecosystems, have flatter hierarchies than German or Japanese counterparts. First-name basis is common after initial introductions.
- **Exceptions**: Financial services (Bay Street in Toronto) and government (Ottawa) are more formal and hierarchical. Use titles until invited to use first names.

## Major Business Centers & Sector Mapping

| City/Region | Primary Industries | Secondary Industries | Buyer Profile | Notes |
|---|---|---|---|---|
| **Toronto / GTA** | Financial services, SaaS, fintech, professional services | Media, insurance, real estate | Sophisticated, US-style; compliance-driven in finance | Bay Street is Canada's Wall Street; 5 major banks dominate; MaRS Discovery District is the innovation hub |
| **Montreal** | AI/ML, gaming, aerospace, life sciences | Fintech, e-commerce, creative industries | Technical, French-first in Quebec; bilingual in tech | Mila (Montreal Institute for Learning Algorithms) is world-class; Ubisoft, EA, and indie studios; CAE, Bombardier |
| **Vancouver** | Gaming, DevTools, clean tech, film/TV | SaaS, e-commerce, mining | West-coast culture, more startup-friendly; environmentally conscious | Slack's origin; Hootsuite, Clio; Pacific Rim trade gateway |
| **Calgary** | Energy, energy tech, ag tech | Financial services, logistics | Conservative, oil-and-gas legacy; energy transition driving new budgets | Stampede culture; Suncor, TC Energy; growing clean tech cluster |
| **Ottawa** | Gov-tech, defense, telecom, cybersecurity | SaaS, life sciences | Federal procurement cycles (6–18 months); security-cleared buyers | SSC (Shared Services Canada) is the gating procurement body; NRC, DRDC |
| **Waterloo** | SaaS, fintech, insurtech, quantum computing | DevTools, EdTech | University-driven talent (UW, WLU); startup-friendly; "Canada's Silicon Valley" | Communitech hub; OpenText, D2L, Maple, ApplyBoard |
| **Edmonton** | AI/ML, energy, ag tech | Health innovation | Growing AI cluster (Amii); government investment in diversification | U of A AI heritage (RLlab); less competitive outbound market |
| **Halifax** | Ocean tech, fintech, defense | Life sciences, agri-food | Smaller market, lower competition, growing tech scene | DeepSense ocean supercomputing; FinTech sandbox |

### Sector Strengths & Signal Sources

- **Banking & Financial Services**: Canada's "Big Six" banks (RBC, TD, Scotiabank, BMO, CIBC, National Bank) are among the world's most stable. OSFI (Office of the Superintendent of Financial Institutions) regulates. Procurement signals: OSFI technology guidelines, OSC (Ontario Securities Commission) filings, bank annual reports.
- **AI/ML**: Montreal (Mila), Toronto (Vector Institute), Edmonton (Amii) form Canada's "AI triangle." Signal: CIFAR funding, NSERC grants, Mila/Vector/Amii research publications.
- **Mining & Resources**: Toronto is the global capital of mining finance (TSX lists ~50% of the world's public mining companies). Calgary is the energy capital. Signal: NI 43-101 technical reports on SEDAR+, CIM awards.
- **Gaming**: Montreal (Ubisoft, EA, WB Games), Vancouver (EA, Relic, Kabam), Toronto (Rockstar, Ubisoft). Signal: interaction with provincial tax credits (Quebec C3, BC interactive digital media tax credit).
- **Clean Tech**: BC (Carbon Engineering, General Fusion), Ontario (Brookfield Renewable), Alberta (Eavor, Kelvin). Signal: Sustainable Development Technology Canada (SDTC) funding, provincial clean tech funds.
- **Cybersecurity**: Ottawa (national defense cluster), Toronto (Quantum-Safe Security), Waterloo (ISK). Signal: Canadian Centre for Cyber Security advisories, ITSA clearance.

## Language & Localization

### Official Languages

- **English**: Primary business language in all provinces except Quebec. ~58% of Canadians speak English as a first language.
- **French**: Official language of Quebec; co-official language of New Brunswick. ~22% of Canadians speak French as a first language. ~18% are bilingual (English/French), concentrated in Quebec and New Brunswick.

### Quebec — Bill 96 (2022) and the Charter of the French Language

Bill 96 (Law 96, officially An Act respecting French, the official and common language of Québec) significantly strengthened French-language requirements in Quebec. For B2B outreach:

- **Commercial communications** to Quebec residents must be available in French. This includes emails, landing pages, contracts, invoices, and marketing materials.
- **English is permitted alongside French**, but French must be "at least equivalent" in prominence — not smaller, not less visible.
- **Websites**: Any website targeting Quebec consumers (and arguably B2B prospects) must have a French version that is at least as complete and accessible as the English version.
- **Contracts**: Employment contracts and consumer contracts must be in French. B2B contracts may be in English if both parties agree, but the French version governs in case of conflict.
- **Penalties**: The OQLF (Office québécois de la langue française) can issue fines of CAD $3,000–$30,000 per offense for businesses.

### Federal Regulated Industries

Banking (Bank Act), telecom (Telecommunications Act), and transportation (Canada Transportation Act) are federally regulated. These industries must provide bilingual services under the Official Languages Act. Outreach to these sectors should offer French-language materials by default.

### Localization Best Practices

- **Canadian English spelling**: Use Canadian conventions (colour, centre, organisation, analyse) — not American. This small signal demonstrates awareness.
- **Quebec outreach**: Always lead in French. Subject lines, email body, and CTAs must be in French. English can follow if the prospect responds in English.
- **Indigenous languages**: Not required for B2B outreach, but acknowledging land acknowledgments (especially for government and university prospects) demonstrates cultural sensitivity.

## Channel Preferences & Restrictions

| Channel | Permission Model | Opt-in vs Opt-out | Best Practice | Restrictions |
|---|---|---|---|---|
| **Email (B2B)** | CASL: implied OK for 2yr EBR; express safer | Opt-out (with consent basis) | Always include unsubscribe + sender address + phone/URL | No tracking pixels without consent (PIPEDA purpose limitation); French required for Quebec |
| **Phone (B2B)** | DNCL: B2B numbers generally exempt | N/A (opt-out on request) | Scrub against DNCL quarterly; honor internal DNC; identify self at start | 9am–9:30pm local time; no auto-dialers to mobile without consent |
| **LinkedIn DM** | CASL applies if commercial; ToS compliance | Opt-out (CASL) | Connection-first, then pitch after 1–2 exchanges; French for Quebec | LinkedIn Sales Navigator essential for Canadian targeting |
| **SMS (B2B)** | Express consent required under CASL | Opt-in | Avoid for cold; use for appointment reminders only | TCPA-equivalent risk; CASL penalties apply |
| **Direct mail** | No federal restriction | N/A | Effective for executive-tier outreach; high cost per unit | Quebec: French required on all commercial materials |
| **Events** | N/A | N/A | High ROI for enterprise; Collision (Toronto), C2 Montreal, Banff Forum | Post-event follow-up must be CASL-compliant |

### Channel Mix Recommendations

- **Default sequence**: Email → LinkedIn → Email → Phone → Email → LinkedIn → Breakup email (7 touches over 21–28 days)
- **SaaS mid-market**: Email-heavy (60%), LinkedIn (25%), Phone (15%)
- **Enterprise financial services**: Event + Email + Phone (relationship-driven)
- **Quebec**: Email in French + LinkedIn in French + Phone (bilingual SDR)

## Tax & Financial Infrastructure

### Tax ID Formats

| Identifier | Format | Issuer | Notes |
|---|---|---|---|
| **BN (Business Number)** | 9 digits (e.g., 123456789) + program account | CRA | Universal tax identifier; every business must have one |
| **GST/HST number** | BN + RT + 4-digit reference | CRA | Required for businesses with >CAD $30K annual revenue |
| **NEQ (Quebec)** | 10 digits | REQ | Quebec enterprise identifier |
| **QST number** | Assigned by Revenu Québec | Revenu Québec | Quebec sales tax registration |
| **Corporation number** | 6–7 digits | ISED (federal) or provincial | Federal or provincial corporate identifier |

### GST/HST Rates

- **Federal GST**: 5% (all provinces)
- **HST (harmonized)**: Ontario 13%, New Brunswick 15%, Newfoundland & Labrador 15%, Nova Scotia 15%, Prince Edward Island 15%
- **Provincial sales tax**: Quebec QST 9.975%, BC PST 7%, Saskatchewan PST 6%, Manitoba RST 7%
- **Alberta**: No provincial sales tax — only 5% GST

### Financial Reporting Requirements

- **Private companies**: No public filing requirement for financial statements. Tax returns filed with CRA. Some provinces require financial statements to be available to shareholders.
- **Public companies**: Must file financial statements, MD&A, AIF (Annual Information Form) via SEDAR+. Follow IFRS (International Financial Reporting Standards) — Canada adopted IFRS for public companies in 2011.
- **Distributing corporations** (public): Audit required. Non-distributing (private): No audit requirement unless shareholders request (CBCA section 148).

### Banking & Payment Infrastructure

- **Payments**: Interac e-Transfer is the dominant B2B payment rail for small-to-mid transactions. Wire transfers and EFT for larger amounts. Credit card accepted for SaaS subscriptions.
- **Currency**: All Canadian business transactions expected in CAD. US-dollar invoicing is acceptable but less common.
- **Major banks**: RBC, TD, Scotiabank, BMO, CIBC, National Bank — these six banks hold ~90% of Canadian banking assets and are key B2B targets.

## Data Sources & Verification

### Official Sources

| Source | URL | Data Available | Cost |
|---|---|---|---|
| **ISED Corporations Canada** | `ised-isde.canada.ca` | Federal corporation name, number, status, address | Free (basic); Paid (extracts) |
| **SEDAR+** | `sedarplus.ca` | Public company filings, financials, prospectuses | Free |
| **CRA GST/HST Registry** | `canada.ca/en/revenue-agency` | GST/HST registration status, legal name, BN | Free |
| **Ontario Business Registry** | `ontario.ca` | Ontario corporation info, directors | Free (basic); Paid (extracts) |
| **REQ (Quebec)** | `registreentreprises.gouv.qc.ca` | Quebec enterprise info, NEQ, addresses | Free (basic); Paid (detailed) |
| **BC Registry** | `bcregistry.gov.bc.ca` | BC corporation info | Paid |
| **TSX/TSXV** | `tmx.com` | Public company listings, quotes | Free (basic) |

### Commercial Data Sources

| Source | Strengths | Notes |
|---|---|---|
| **LinkedIn Sales Navigator** | Best for Canadian professional data; 62% penetration | Essential for B2B prospecting in Canada |
| **ZoomInfo** | Strong Canadian coverage, direct dials | Premium pricing; good for enterprise |
| **Apollo.io** | Good Canadian email coverage, affordable | Good for mid-market |
| **Company360 (Informatica)** | Canadian-specific corporate data | Best for detailed Canadian corporate intelligence |
| **IBISWorld Canada** | Industry research, market sizing | Essential for ICP research |
| **Crunchbase** | Funding data, Canadian startups | Good for signal-based prospecting |
| **PitchBook** | VC/PE data, Canadian deals | Good for identifying funded companies |

### Person Data Sources

- **LinkedIn**: Primary source for Canadian B2B contacts. French-language profiles are common for Quebec professionals.
- **CASA (Canadian Association of Search firms)**: For executive-level recruiting intelligence.
- **Industry associations**: CATA (Canadian Advanced Technology Alliance), ICTC (Information and Communications Technology Council), CVCA (Canadian Venture Capital and Private Equity Association).

## ICP Considerations by Sector

### Financial Services

- **Company size**: Big Six banks (50K–90K employees); credit unions (200–5,000); fintechs (10–500)
- **Decision-making**: Centralized procurement for banks (vendor management offices); faster for credit unions and fintechs
- **Revenue benchmarks**: Big Six — CAD $20B–$60B revenue; mid-market credit unions — CAD $500M–$5B
- **Key signals**: OSFI technology guidelines updates, bank quarterly earnings, PCI compliance renewal, SOC 2 certification cycle
- **Data residency**: Non-negotiable for banks — must host in Canada (ca-central-1 or Azure Canada Central)

### AI/ML & Deep Tech

- **Company size**: Startups (5–50), scale-ups (50–500), research institutes (Mila, Vector, Amii)
- **Decision-making**: Founder/CTO-led for startups; VP-level for scale-ups
- **Revenue benchmarks**: Pre-revenue to CAD $50M; heavily funded (CIFAR, NSERC, SR&ED)
- **Key signals**: CIFAR/NSERC grants, SR&ED claims, Mila/Vector affiliation, GitHub activity, NeurIPS/ICML publications
- **Localization**: Bilingual capability is a plus but not required; Montreal AI community often operates in English

### Mining & Resources

- **Company size**: Juniors (5–50 employees, exploring), mid-tiers (200–2,000), majors (5,000–50,000)
- **Decision-making**: Board-driven for juniors; procurement-led for majors
- **Revenue benchmarks**: Juniors — pre-revenue or <$10M; mid-tiers — $100M–$1B; majors — $5B–$40B
- **Key signals**: NI 43-101 reports on SEDAR+, drilling results, permitting milestones, commodity price movements
- **Special consideration**: TSX-V is the primary listing exchange for junior miners; many have minimal web presence

### SaaS & DevTools

- **Company size**: 20–500 employees typical
- **Decision-making**: VP/Director of Engineering or Product; faster cycles (30–60 days)
- **Revenue benchmarks**: $1M–$100M ARR
- **Key signals**: SR&ED claims (public indicator of R&D activity), hiring on LinkedIn, GitHub stars, product launches
- **Differentiator**: Canadian SaaS companies are cost-sensitive — lead with ROI and Canadian pricing

### Clean Tech & Energy Transition

- **Company size**: 10–200 employees for startups; 1,000+ for incumbents
- **Decision-making**: CEO/CTO for startups; VP Sustainability for incumbents
- **Revenue benchmarks**: Pre-revenue to $50M for startups; $1B+ for incumbents
- **Key signals**: SDTC funding, provincial clean tech grants, carbon pricing impact, net-zero commitments
- **Regional bias**: BC and Alberta dominate; Ontario growing

## Outreach Compliance Checklist

### Pre-Outreach

- [ ] Verify company exists and is active in ISED or provincial registry
- [ ] Determine province of operation — Quebec Law 25 triggers additional requirements
- [ ] Identify consent basis: express consent (opt-in form, download) or implied consent (EBR within 2 years, or conspicuous publication with relevance)
- [ ] Document the consent basis and source for each contact in your CRM
- [ ] Prepare French-language version of outreach for Quebec prospects
- [ ] Confirm sender identification in every email template: name, physical address, phone or URL
- [ ] Verify unsubscribe mechanism is functional and one-click
- [ ] Prepare privacy policy link in email footer
- [ ] For phone: scrub numbers against National DNCL (every 31 days); prepare internal DNC list
- [ ] For financial services prospects: confirm data residency capability (ca-central-1 or Azure Canada Central)

### During Outreach

- [ ] Include sender identification (name, address, phone/URL) in every email
- [ ] Include one-click unsubscribe in every email
- [ ] Use French-language outreach for Quebec prospects by default
- [ ] Do not use tracking pixels without consent (PIPEDA/Quebec Law 25)
- [ ] Do not use deceptive subject lines or sender information
- [ ] Honor unsubscribe requests within 10 business days
- [ ] For phone: identify yourself and your company at the start of every call
- [ ] For phone: call only between 9am–9:30pm local time
- [ ] For phone: honor internal DNC requests immediately
- [ ] Document all outreach attempts and consent basis

### Post-Outreach

- [ ] Process all unsubscribe requests within 10 business days
- [ ] Update internal DNC list with any opt-out requests
- [ ] Maintain records of consent basis for 2 years after last contact
- [ ] Store outreach records (emails sent, responses, consent documentation) for audit purposes
- [ ] Monitor for PIPEDA/Quebec Law 25 DSARs — respond within 30 days (PIPEDA) or "without delay" (Quebec)
- [ ] Report any data breaches to OPC (PIPEDA) and CAI (Quebec Law 25) within required timeframes

### Record-Keeping Requirements

- **CASL**: Maintain records of consent (how, when, what was presented) for the duration of the consent + 3 years after withdrawal
- **PIPEDA**: Maintain records of personal information collection, use, and disclosure; breach records for 24 months
- **Quebec Law 25**: Maintain PIAs, consent records, privacy policies, and breach records; available to CAI on request
- **Practical rule**: Keep all consent and outreach records for **minimum 3 years** after the last interaction

## Regional Playbook Templates

### Template 1: English-Canada B2B Cold Email (SaaS/DevTools)

```
Subject: [Company Name]'s [relevant metric/process] — quick question

Hi [First Name],

Noticed [Company] recently [trigger: hired 3 SDRs / raised Series B / expanded to new office].
That kind of growth usually means [relevant pain point: pipeline creation becomes a bottleneck / data enrichment slows down / compliance overhead increases].

We helped [Canadian reference, e.g., "Shopify" or "Clio"] reduce [metric] by [X]% in [timeframe], specifically because [reason relevant to their situation].

Worth a 15-minute call this week to see if it's relevant?

[Your Name]
[Title] | [Company]
[Phone] | [Address]
[One-click unsubscribe link]
```

### Template 2: Quebec B2B Cold Email (French-first)

```
Objet: [Nom de l'entreprise] et [sujet pertinent] — question rapide

Bonjour [Prénom],

J'ai remarqué que [Entreprise] a récemment [déclencheur: embauché X personnes / levé des fonds / lancé un nouveau produit].
Ce type de croissance entraîne souvent [point de douleur pertinent].

Nous avons aidé [référence canadienne/francophone] à réduire [métrique] de [X]% en [délai], précisément parce que [raison].

Cela vaut-il la peine d'en discuter brièvement cette semaine?

[Votre Nom]
[Titre] | [Entreprise]
[Téléphone] | [Adresse]
[Lien de désabonnement en un clic]
```

### Template 3: Enterprise Financial Services Breakup Email

```
Subject: Closing the loop — [Company] + [Your Company]

Hi [First Name],

I've reached out a few times about [value proposition]. I don't want to clutter your inbox if this isn't a priority right now.

If data residency and compliance for [specific use case] is on your roadmap for this fiscal year, I'm happy to pick up the conversation when the timing is right. We're SOC 2 Type II certified, data-resident in Canada (ca-central-1), and currently work with [2-3 Canadian financial references].

Either way, best of luck with [specific initiative mentioned in research].

[Your Name]
[Title] | [Company]
[Phone] | [Address]
[One-click unsubscribe link]
```

## Knowledge Gaps & Expansion Notes

- **Indigenous business procurement**: Need a sub-doc on Indigenous business considerations, particularly for resource-sector deals subject to NRCAN Indigenous participation requirements and Impact Benefit Agreements (IBAs).
- **SR&ED as a signal**: Need a dedicated guide on using SR&ED (Scientific Research and Experimental Development) tax credit filings as a B2B signal — SR&ED claimants are high-intent R&D-active companies.
- **Quebec Law 25 compliance deep-dive**: Need a PIA template and consent mechanism guide specific to Quebec Law 25 requirements.
- **Federal government procurement**: Need a detailed guide on selling to the Government of Canada — SSC (Shared Services Canada) procurement, ITSA security clearances, TB (Treasury Board) policies, and ProServices/CSSD standing offers.
- **Provincial health sector**: Need a sub-doc for HealthTech vendors navigating provincial health authority procurement and PHIPA (Ontario) / health data privacy requirements across provinces.
- **CASL private right of action**: Monitor for reactivation — would create class-action risk similar to TCPA in the US.
- **Bill C-27 (CPPA)**: Monitor progress — the Consumer Privacy Protection Act would replace PIPEDA with stricter requirements including AMPs up to $10M/3% revenue.
- **Data residency mapping**: Need a complete mapping of Canadian cloud regions and data residency options for B2B SaaS vendors.
- **Bilingual outreach A/B testing**: Need data on French-first vs English-first outreach performance in Quebec B2B.
