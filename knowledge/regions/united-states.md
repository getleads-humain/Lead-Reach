---
title: "United States — B2B Prospecting & Business Intelligence Guide"
slug: region-united-states
category: regions
tags: [united-states, usa, north-america, b2b, prospecting]
agents: [atlas, scout, forge, sage, judge, bard]
regions: [united-states, usa, north-america]
intent_types: [research_company, research_person, build_icp, compose_outreach]
priority: 88
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "Complete B2B prospecting intelligence for the United States: corporate registries, public company data, regional hubs, and the channels that work."
---

# United States — B2B Prospecting & Business Intelligence Guide

## 1. Country Overview

The United States is the world's largest economy ($27T GDP) and the most mature B2B market. Prospecting infrastructure is highly developed: corporate registries are public, SEC filings provide deep financial data for public companies, and a vast ecosystem of B2B data providers (ZoomInfo, Apollo, Lusha, Cognism) exists.

**Key facts**:
- **GDP**: ~$27T (2024), growing ~2-3%/year
- **Population**: ~335M
- **Currency**: USD
- **Government**: Federal republic; 50 states with significant autonomy
- **Languages**: English (de facto official); Spanish widely spoken
- **Time zones**: EST (UTC-5), CST (UTC-6), MST (UTC-7), PST (UTC-8); plus AKST, HST
- **Internet penetration**: ~92%
- **Business centers**: NYC (finance, media), SF Bay Area (tech), LA (entertainment), Boston (biotech, education), Chicago (industrial, finance), Houston (energy), Atlanta (logistics, media), Seattle (tech, aerospace), Austin (tech), Miami (Latin America gateway), Washington DC (gov, defense)

## 2. Business Registration & Identification

### State-Level Incorporation
US companies are incorporated at the **state level**, not federally. Each state has its own registry:

- **Delaware Division of Corporations** (`corp.delaware.gov`) — >60% of Fortune 500 incorporated here due to favorable corporate law
- **California Secretary of State** (`bizfileonline.sos.ca.gov`) — Most tech startups
- **Texas Secretary of State** (`sos.state.tx.us`) — Growing tech hub
- **New York Department of State** (`dos.ny.gov`) — Finance, media
- **Other states**: Each has a Secretary of State business search

**What you get**: Legal name, entity type (LLC, C-Corp, S-Corp, etc.), filing date, registered agent, status (active/forfeited/dissolved), addresses.

### SEC EDGAR (Public Companies)
**Website**: `sec.gov/edgar`

Every US public company files with the SEC. The EDGAR database provides:
- **10-K** (annual report) — Financials, business description, risk factors, executive compensation
- **10-Q** (quarterly report) — Quarterly financials
- **8-K** (current report) — Material events (M&A, leadership changes, etc.)
- **DEF 14A** (proxy statement) — Board composition, executive compensation
- **Form D** (Reg D) — Private securities offerings (startups raising from accredited investors)
- **Form S-1** — IPO registration statement
- **Section 16 filings** (Forms 3, 4, 5) — Insider trading

The LeadReach `sec-edgar.ts` data source integrates this directly.

### Employer Identification Number (EIN)
- Federal tax ID issued by IRS
- Public for non-profits (searchable on IRS EO Select Check)
- Private for-profit EINs are NOT publicly searchable

### NAICS & SIC Codes
- **NAICS** (North American Industry Classification System) — 6-digit; standard for US/Canada/Mexico
- **SIC** (Standard Industrial Classification) — Older 4-digit system; still used in SEC filings
- Useful for industry filtering

## 3. Key Industries & Regional Hubs

### Technology
- **SF Bay Area** (San Francisco, San Jose, Oakland): Apple, Google, Meta, Salesforce, Uber, Airbnb, Stripe
- **Seattle**: Amazon, Microsoft, Zillow, Tableau
- **Austin**: Dell, Oracle (relocated), Tesla (relocated), emerging tech
- **Boston**: HubSpot, Akamai, DraftKings, biotech-tech crossover
- **NYC**: Google (major office), Meta, Bloomberg, IBM, MongoDB, Squarespace
- **Denver/Boulder**: Tech migration destination;成熟 startup ecosystem

### Financial Services
- **NYC** (Wall Street): Goldman Sachs, JPMorgan, Morgan Stanley, Citigroup, BlackRock
- **Charlotte**: Bank of America, Wells Fargo (eastern operations)
- **San Francisco**: Wells Fargo HQ, Visa, Schwab
- **Boston**: Fidelity, State Street, MFS
- **Chicago**: CME Group, CBOE, BMO Harris, Northern Trust

### Healthcare & Life Sciences
- **Boston/Cambridge**: Biotech hub (Moderna, Pfizer operations, Vertex, Biogen)
- **Bay Area**: Genentech, Gilead, UCSF spinouts
- **Research Triangle Park (NC)**: GSK, Bayer, Pfizer operations
- **Houston**: Texas Medical Center (largest in world)
- **Rochester, MN**: Mayo Clinic
- **Cleveland**: Cleveland Clinic

### Manufacturing
- **Detroit**: Automotive (Ford, GM, Stellantis NA)
- **Midwest generally**: Manufacturing belt — Ohio, Indiana, Wisconsin
- **Houston**: Energy + industrial
- **South Carolina**: BMW, Boeing, automotive
- **Pacific Northwest**: Boeing (Seattle/Charleston)

### Energy
- **Houston**: Oil & gas capital (ExxonMobil, Chevron US ops, ConocoPhillips)
- **Dallas**: Energy + finance
- **Oklahoma City**: Devon, Chesapeake
- **Denver**: Energy + mining

### Entertainment & Media
- **LA/Hollywood**: Entertainment (Disney, Universal, Sony Pictures, Netflix, Warner Bros)
- **NYC**: Media (NBC, CBS, ABC, NYT, Fox, CNN)
- **Nashville**: Music industry

### Retail & E-commerce
- **Seattle**: Amazon, Costco, Nordstrom, REI
- **Bentonville, AR**: Walmart HQ
- **Minneapolis**: Target, Best Buy
- **Atlanta**: Home Depot, UPS, Coca-Cola

### Aerospace & Defense
- **Washington DC area**: Lockheed Martin, General Dynamics, Northrop Grumman, Booz Allen
- **Connecticut**: RTX (Raytheon), Pratt & Whitney, Sikorsky
- **Wichita**: Spirit AeroSystems, Cessna, Beechcraft
- **St. Louis**: Boeing Defense
- **Huntsville, AL**: NASA Marshall, defense contractors

## 4. Business Culture & Communication Norms

### Directness
- US business culture is **direct and results-oriented**
- Time is money — meetings start on time, end on time, agendas are followed
- Small talk is brief (weather, sports, weekend) — quickly move to business
- Decisions are often made in-meeting or shortly after

### Hierarchy
- Less hierarchical than Asia/Europe; first names common even with C-suite
- "John" rather than "Mr. Smith" in most tech companies
- Exceptions: traditional industries (banking, law, healthcare) may use titles

### Communication Channels
- **Email** — Primary B2B channel; expected within 24-hour response
- **LinkedIn** — Universal; used for networking, prospecting, thought leadership
- **Phone** — Still important; cold calling works for SDR teams
- **Zoom / Google Meet** — Standard for remote meetings
- **Slack / Teams** — Internal team communication; sometimes external with vendors
- **SMS / Text** — Increasingly common for B2C; less so for B2B

### Time Zones
The US spans 4 main time zones — schedule accordingly:
- **9am-5pm EST** (UTC-5) = 6am-2pm PST — overlap is short
- Best meeting times: 11am-3pm ET (8am-12pm PT)
- "Pacific" companies (Bay Area, Seattle) prefer 9am-12pm PT
- "Eastern" companies (NYC, Boston) prefer 9am-5pm ET
- Friday afternoon is dead — avoid scheduling

### Holidays
- **New Year's Day** (Jan 1)
- **MLK Day** (3rd Monday January)
- **Presidents Day** (3rd Monday February)
- **Memorial Day** (last Monday May)
- **Juneteenth** (June 19) — federal holiday since 2021
- **Independence Day** (July 4)
- **Labor Day** (1st Monday September)
- **Columbus/Indigenous Peoples Day** (2nd Monday October)
- **Veterans Day** (November 11)
- **Thanksgiving** (4th Thursday November) + following Friday
- **Christmas** (December 25)

Note: Summer (July-August) is slower — many executives on vacation.

## 5. US-Specific Compliance

### CAN-SPAM Act (Commercial Email)
- **Identification**: Sender name and physical address required
- **Unsubscribe**: Must include working unsubscribe; honor within 10 business days
- **Subject lines**: No deceptive subject lines
- **Penalties**: Up to $50K per violation
- **B2B exception**: B2B email is permitted, but must still comply with above

### TCPA (Telephone Consumer Protection Act)
- **Auto-dialers**: Require prior express written consent for auto-dialed calls
- **SMS**: Same as auto-dialers
- **Do Not Call Registry**: Must check against list
- **Penalties**: $500-$1,500 per violation

### State Privacy Laws
- **California (CCPA/CPRA)**: Residents can request deletion, opt out of sale
- **Virginia (VCDPA)**: Similar to CCPA
- **Colorado (CPA)**: Similar
- **Connecticut (CTDPA)**: Similar
- **Utah (UCPA)**: Similar
- More states passing laws annually

### Industry-Specific Regulations
- **HIPAA** (Healthcare): Protected Health Information
- **GLBA** (Financial): Customer financial data
- **FERPA** (Education): Student records
- **COPPA** (Children): Under-13 data
- **FCRA** (Credit reporting): Background checks

## 6. Channels for Finding US Companies

### Public Company Data
- **SEC EDGAR** (`sec.gov/edgar`) — Free; comprehensive
- **Yahoo Finance** (`finance.yahoo.com`) — Free; ticker lookup, financials
- **Google Finance** — Free; basic data
- **Bloomberg Terminal** — Paid; institutional-grade
- **FactSet** — Paid; institutional-grade

### Private Company Data
- **Crunchbase** (`crunchbase.com`) — Freemium; startups and VC-backed
- **PitchBook** — Paid; deeper private company data
- **CB Insights** — Paid; research and data
- **ZoomInfo** — Paid; contact database
- **Apollo.io** — Freemium; contact database
- **Lusha** — Paid; contact database
- **Cognism** — Paid; European/US contact data
- **LinkedIn Sales Navigator** — Paid; LinkedIn search

### Industry-Specific Databases
- **HIMSS Analytics** — Healthcare IT
- **Definitive Healthcare** — Healthcare providers
- **KLD / MSCI ESG** — ESG data
- **GreenBook** — Market research industry
- **AdAge / AdWeek Data** — Advertising industry

### News & Press
- **PRNewswire** (`prnewswire.com`) — Press releases
- **Business Wire** (`businesswire.com`) — Press releases
- **GlobeNewswire** — Press releases
- **TechCrunch** — Tech startup news
- **Axios** — Tech/political news
- **Bloomberg** — Financial news
- **WSJ** — Business news
- **Forbes** — Business profiles
- **Inc. 5000** — Fastest-growing private companies (annual list)
- **Fortune 500** — Largest US companies (annual list)

### Industry Events (Major US B2B Events)
- **CES** (Las Vegas, January) — Consumer tech
- **Dreamforce** (San Francisco, September) — Salesforce ecosystem
- **SaaScribe / SaaStr** — SaaS industry
- **Adobe Summit** (Las Vegas, March) — Marketing tech
- **AWS re:Invent** (Las Vegas, December) — Cloud computing
- **NRF Big Show** (NYC, January) — Retail
- **HIMSS** (various, March) — Healthcare IT
- **ASHG** — Genetics
- **Bio International Convention** — Biotech
- **AIA Conference** — Architecture
- **NAHB International Builders' Show** — Construction
- **World of Concrete** — Construction
- **NAB Show** (Las Vegas, April) — Broadcasting

## 7. Regional Business Differences

### East Coast (NYC, Boston, DC, Atlanta)
- **Pace**: Faster, more formal
- **Communication**: Direct, time-conscious
- **Industries**: Finance, healthcare, government, media
- **Culture**: Suit-and-tie traditional sectors; business attire expected
- **Best outreach times**: 9-11am ET, 2-4pm ET

### West Coast (SF, Seattle, LA, Portland)
- **Pace**: Slightly slower, more collaborative
- **Communication**: More casual, first-name culture
- **Industries**: Tech, entertainment, aerospace
- **Culture**: Casual attire (hoodies common in tech); flat hierarchies
- **Best outreach times**: 9-11am PT, 1-3pm PT

### Midwest (Chicago, Minneapolis, Detroit, Milwaukee)
- **Pace**: Moderate, relationship-focused
- **Communication**: Polite, mid-western friendliness
- **Industries**: Manufacturing, agriculture, finance
- **Culture**: Traditional; handshakes matter; long lunch meetings common
- **Best outreach times**: 9-11am CT, 2-4pm CT

### South (Atlanta, Houston, Dallas, Miami, Charlotte)
- **Pace**: Slower, relationship-driven
- **Communication**: Polite, indirect compared to East Coast
- **Industries**: Energy, finance, logistics, healthcare
- **Culture**: Southern hospitality; meals important
- **Best outreach times**: 9-11am CT/ET, 2-4pm

### Mountain West (Denver, Salt Lake City, Phoenix)
- **Pace**: Relaxed but professional
- **Communication**: Direct, friendly
- **Industries**: Tech migration, energy, outdoor industry
- **Culture**: Outdoor-oriented; casual
- **Best outreach times**: 9-11am MT, 1-3pm MT

## 8. Email Outreach Best Practices for US

### CAN-SPAM Compliance Checklist
- ✅ Physical mailing address in email footer
- ✅ Clear "Unsubscribe" link
- ✅ Honored within 10 business days
- ✅ Accurate "From" name and email
- ✅ Non-deceptive subject line
- ✅ Recipient opted in OR clear B2B inquiry nature

### Subject Line Patterns That Work
- Question: "still using [incumbent tool]?"
- Trigger reference: "noticed your [recent announcement]"
- Specific value: "[metric] for [specific segment]"
- Mutual connection: "[name] suggested i reach out"

### Send Times
- **Best days**: Tuesday, Wednesday, Thursday
- **Avoid**: Monday morning (catch-up mode), Friday afternoon (weekend mode)
- **Best times**: 9-10am local, 1-2pm local (post-lull), 4-5pm local (closing out day)
- **Avoid**: Before 7am, after 6pm, weekends

### Follow-up Cadence
- Day 0: Initial email
- Day 2-3: First follow-up (reply to original; new angle)
- Day 5-7: Second follow-up (different value prop or trigger)
- Day 10-14: Third follow-up (case study or social proof)
- Day 21: Breakup email

## 9. Phone Outreach Best Practices

### TCPA Compliance
- Do not auto-dial mobile numbers without express written consent
- Check Do Not Call Registry (for B2C; B2B exempt but still wise)
- Maintain internal DNC list
- Identify yourself and company immediately
- Provide callback number

### Cold Call Structure (First 30 Seconds)
1. **Pattern interrupt**: "Hi [Name], this is [Your Name] from [Company]. I know I'm calling out of the blue — can I have 30 seconds to explain why, and you can tell me to go away?"
2. **Specific reason**: "I noticed [specific trigger — recent hire, funding, expansion]"
3. **Value**: "We help [similar companies] with [specific outcome]"
4. **Ask**: "Is this a problem you're thinking about, or am I off base?"

### Best Call Times
- Tuesday-Thursday
- 10-11am local
- 4-5pm local (catching people wrapping up)

## 10. Common US Prospecting Mistakes

### Mistake 1: Wrong Time Zone
Calling a PST prospect at 9am EST = 6am PST. Always check time zones.

### Mistake 2: Ignoring State Privacy Laws
Sending to a California resident without CCPA compliance = legal risk.

### Mistake 3: No Unsubscribe Link
CAN-SPAM violation; fines add up.

### Mistake 4: Generic Templates
US buyers get 50+ cold emails/day. Generic templates get ignored. Personalization is mandatory.

### Mistake 5: Assuming US English is Universal
- Some US regions have Spanish as primary language (Miami, parts of Texas, California)
- The US South has different business culture than the Northeast
- "Y'all", regional sports, regional industries matter for personalization

### Mistake 6: Wrong Industry Reference
Pitching a "Wall Street bank" to a community bank in Iowa feels tone-deaf. Match the reference to the prospect.

### Mistake 7: Holiday Blindness
- Don't schedule important calls day before/after major holidays
- Summer (July-August) is slow — many decision-makers on vacation
- December 15-January 5 is dead — year-end close, holidays
- Avoid September 1 (Labor Day week), November 25-28 (Thanksgiving week)

## 11. LeadReach Pipeline for US Prospecting

1. **Atlas** identifies US as geography, identifies industry/sub-segment
2. **Sage** loads this US knowledge file + relevant industry knowledge
3. **Scout** searches:
   - SEC EDGAR (public companies) — direct integration
   - OpenCorporates — state filings
   - Crunchbase (startups)
   - LinkedIn Sales Navigator (people)
   - Industry news (TechCrunch, Axios, etc.)
   - Industry-specific databases
4. **Forge** enriches with:
   - SEC EDGAR financials (10-K, 10-Q)
   - Yahoo Finance (real-time stock data via yfinance)
   - yfinance for stock data
   - PublicWWW for tech stack
   - LinkedIn for executives
5. **Judge** qualifies by:
   - Public company: financials, growth rate, executive tenure
   - Private company: funding, headcount growth, hiring patterns
   - ICP match across all dimensions
6. **Bard** prepares outreach (CAN-SPAM compliant, personalized, regional tone)
7. **Flow** routes to appropriate sequence (email, LinkedIn, phone — multi-touch)
8. **Echo** reports on campaign performance with US-specific benchmarks
