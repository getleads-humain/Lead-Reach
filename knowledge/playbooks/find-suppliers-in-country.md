---
title: "Playbook: Find Industry Suppliers in a Specific Country"
slug: playbook-find-suppliers-in-country
category: playbooks
tags: [playbook, suppliers, discovery, country, agriculture, manufacturing]
agents: [atlas, scout, forge, sage, judge, bard, flow, echo]
industries: [agriculture, manufacturing, food, trade]
intent_types: [research_company, discover_places, build_icp]
priority: 90
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "End-to-end playbook for finding suppliers/manufacturers of a specific product in a specific country. Canonical example: 'Dragonfruit suppliers in Vietnam'."
---

# Playbook: Find Industry Suppliers in a Specific Country

## 1. When to Use This Playbook

This playbook applies when the user query has the pattern:
> "Find [product] suppliers/manufacturers/exporters in [country/region]"

Examples:
- "Dragonfruit suppliers in Vietnam"
- "Coffee exporters in Colombia"
- "Textile manufacturers in Bangladesh"
- "Auto parts suppliers in Mexico"
- "Furniture makers in Indonesia"

This is a **discovery-at-scale** playbook — the goal is broad coverage (50-500 prospects), not deep profiling.

## 2. Query Decomposition (Atlas)

Atlas decomposes the query into:

### Entities
- **Product**: What product? (e.g., "dragonfruit")
- **Geography**: Which country/region? (e.g., "Vietnam")
- **Role in value chain**: Suppliers? Manufacturers? Exporters? Distributors? Importers?
- **Additional qualifiers**: Certifications? Size? Export markets?

### Constraints
- Time period (recent only?)
- Quality bar (verified only? certified only?)
- Quantity (top 50? top 500?)

### Knowledge Retrieval
Atlas loads:
- **Region knowledge file** (e.g., `regions/vietnam.md`)
- **Industry knowledge file** (e.g., `industries/agriculture-food-trade.md`)
- **Tool catalog** (`tools/data-sources-catalog.md`)

## 3. Source Strategy (Scout)

Scout searches across 7+ channels in parallel:

### Channel 1: Government Trade Directories
Most countries have official trade promotion agencies with exporter directories:
- **Vietnam**: VIETRADE (`vietrade.gov.vn`), VCCI (`vcci.com.vn`)
- **India**: India Trade Promotion Organisation, Export Promotion Councils
- **China**: China Council for Promotion of International Trade (CCPIT)
- **Brazil**: Apex-Brasil
- **Mexico**: PROMEXICO
- **Colombia**: ProColombia
- **Thailand**: Department of International Trade Promotion (DITP)

**Search pattern**:
```
site:vietrade.gov.vn [product] exporters
site:vcci.com.vn [product] members
```

### Channel 2: Industry Associations
Product-specific associations maintain member lists:
- **Vietnam Dragon Fruit Association**
- **Brazil Coffee Exporters Council (CECAFE)**
- **India Spice Board**
- **Bangladesh Garment Manufacturers and Exporters Association (BGMEA)**
- **China Chamber of Commerce for Metals, Minerals & Chemicals Importers & Exporters (CCCMC)**

### Channel 3: B2B Marketplaces
- **Alibaba** — Filter by country + product category
- **Global Sources** — More curated
- **Made-in-China.com** — Also lists non-Chinese Asian suppliers
- **TradeKey** — Global B2B
- **EC21** — Korean-led, global reach

### Channel 4: Customs / Trade Data
- **Panjiva** (paid) — Bill of lading data
- **ImportGenius** (paid) — Similar
- **UN Comtrade** (free) — Country-level trade data only
- **National customs agency** — Many publish exporter lists

### Channel 5: News & Trade Publications
- **Industry-specific news**: FreshPlaza (food), Just-Style (apparel), SportTechie (sporting goods)
- **Regional business news**: Vietnam Investment Review, Bangkok Post Business, etc.
- **Trade show coverage**: Asia Fruit Logistica, Canton Fair, etc.

### Channel 6: Maps / Places
- **Google Maps** via browser-service
- **OpenStreetMap Overpass** (free alternative)
- Search: `[product] + [region/city]`
- Returns: Physical locations, addresses, contact info

### Channel 7: Certification Databases
- **GlobalG.A.P. certified producers** — Searchable database
- **USDA Organic Integrity Database**
- **BRC Directory** — British Retail Consortium certified
- **Fair Trade Certified** — Searchable
- **ISO Certified organizations** — Searchable by ISO standard

### Channel 8: LinkedIn (Limited Yield)
LinkedIn has lower penetration in agriculture/manufacturing but worth trying:
- Filter by country + industry + company size
- Search for: `[product] + [country]`

### Channel 9: Trade Shows & Conferences
Many trade shows publish exhibitor lists:
- **Asia Fruit Logistica** (Hong Kong)
- **Fruit Logistica** (Berlin)
- **Gulfood** (Dubai)
- **Canton Fair** (Guangzhou)
- **SIAL Paris**
- **Anuga** (Cologne)
- **Hannover Messe** (industrial)

## 4. Execution Plan

### Step 1: Parallel Channel Search (60 seconds)
Scout runs all 9 channels in parallel, with each channel returning up to 50 results.

```typescript
const channelResults = await Promise.allSettled([
  searchGovernmentDirectories(product, country),
  searchIndustryAssociations(product, country),
  searchB2BMarketplaces(product, country),
  searchCustomsData(product, country),
  searchNewsAndTradePubs(product, country),
  searchMaps(product, country),
  searchCertifications(product, country),
  searchLinkedIn(product, country),
  searchTradeShows(product, country),
]);
```

### Step 2: Aggregate & Deduplicate (5 seconds)
Combine all results, deduplicate by:
1. Website domain (strongest signal)
2. Company name + phone
3. Company name + city
4. Fuzzy name match + same industry

Expected: 9 channels × 50 results = 450 raw → 100-300 unique after dedup

### Step 3: Quick Quality Filter (5 seconds)
Remove obvious noise:
- Companies with no contact info (no phone, no email, no website)
- Companies in wrong country (filter by address)
- Companies clearly in wrong industry (manual spot-check)
- Duplicate subsidiary + parent (keep parent)

Expected: 100-300 → 50-200 quality prospects

### Step 4: Enrichment (Forge) — 2-5 minutes
For each remaining prospect, run Forge enrichment in parallel (5-10 at a time):

```typescript
const batchSize = 5;
for (let i = 0; i < prospects.length; i += batchSize) {
  const batch = prospects.slice(i, i + batchSize);
  await Promise.all(batch.map(p => enrichProspect(p)));
}
```

Each enrichment includes:
- Verify tax code (via masothue.com for Vietnam, etc.)
- Geocode address (Nominatim)
- Verify phone (call or WhatsApp check)
- Detect website (PublicWWW)
- Find certifications (GlobalG.A.P. database)
- Find key personnel (LinkedIn, website scraping)
- Find recent news (News Worker)

### Step 5: Analysis (Sage) — 1-2 minutes
Sage analyzes the enriched set:
- Segment by export market focus
- Segment by certification level
- Identify trigger events (recent certifications, news, trade show attendance)
- Identify top 10 by estimated export volume

### Step 6: Qualification (Judge) — 1-2 minutes
Judge qualifies each prospect:
- Score by completeness (verified contact info scores higher)
- Score by certification (GlobalG.A.P. > VietGAP > uncertified)
- Score by export market fit (matches user's intended market)
- Score by company maturity (years in business, employee count)

### Step 7: Outreach Templates (Bard) — 30 seconds
Bard prepares outreach templates:
- Inquiry email template (bilingual if needed)
- WhatsApp message template (preferred channel in many countries)
- Trade show meeting request template

### Step 8: Pipeline Routing (Flow) — 10 seconds
Flow routes qualified prospects:
- Forward to Leads section with structured fields
- Tag with: country, industry, certification, export market
- Set initial stage: "Identified"

### Step 9: Reporting (Echo) — 30 seconds
Echo reports campaign results:
- Total companies found
- Quality distribution (verified vs. unverified)
- Geographic distribution (by province/region)
- Certification distribution
- Recommended next steps

## 5. Expected Output

The user sees a fully populated campaign detail page with:
- **Total count**: 50-200 verified suppliers
- **Filter sidebar**: by region, by certification, by export market, by size
- **Company cards**: Name, location, contact info, certifications, export markets
- **Map view**: Geocoded locations on map
- **Export options**: CSV, Excel, PDF
- **Forward to Leads**: Button to push qualified prospects to Leads section

## 6. Failure Modes & Mitigations

### Failure 1: Zero Results Found
**Causes**:
- Product name too narrow (try synonyms, local language)
- Country too restrictive (try region instead)
- No online presence for this industry

**Mitigations**:
- Try alternative spellings / transliterations
- Try broader geography
- Try adjacent industries
- Suggest user provide seed companies to expand from

### Failure 2: 90%+ Results Are Trading Companies, Not Producers
**Cause**: B2B marketplaces favor trading companies
**Mitigation**:
- Filter by address (manufacturers usually have factory address)
- Check company description for "manufacturer" vs "trader"
- Cross-reference with customs data (actual exporters)
- Check industry association member lists (usually producers)

### Failure 3: Most Prospects Have No Verifiable Contact Info
**Cause**: Industry has low digital adoption
**Mitigations**:
- Try phone (more universal than email in developing countries)
- Try WhatsApp (very common in Latin America, Southeast Asia)
- Try WeChat (China-focused)
- Accept lower data completeness; mark as "needs human research"

### Failure 4: Conflicting Results Across Channels
**Cause**: Same company listed with different names, addresses, or contacts
**Mitigations**:
- Use tax code / registration number as primary deduplication key
- Prefer government registry data for canonical name and address
- Keep all variants as aliases

### Failure 5: Rate Limits Hit Mid-Campaign
**Cause**: Multiple sources rate-limiting in parallel
**Mitigations**:
- Back off and continue with remaining sources
- Cache partial results
- Re-run enrichment for failed prospects in a second pass

## 7. Adaptation for Different Industries

### Agriculture / Food
- Priority channels: Government trade directories, certification databases, industry associations
- Key data: Certifications (GlobalG.A.P., organic), export markets, harvest season, MOQ
- Best outreach channel: WhatsApp + email (bilingual)
- Reference: `industries/agriculture-food-trade.md` + `regions/vietnam.md`

### Manufacturing
- Priority channels: Industry associations, B2B marketplaces, trade show exhibitor lists
- Key data: ISO certifications, factory size, capabilities, MOQ, lead time
- Best outreach channel: Email (formal), sometimes Alibaba message
- Reference: `industries/manufacturing.md`

### Textiles / Apparel
- Priority channels: BGMEA (Bangladesh), BGCC (Cambodia), VITAS (Vietnam), ITA (India)
- Key data: Product categories, factory size, certifications (WRAP, BSCI, SA8000)
- Best outreach channel: Email + trade shows
- Reference: `industries/manufacturing.md`

### Technology / SaaS
- Priority channels: Crunchbase, LinkedIn, Product Hunt, GitHub
- Key data: Funding stage, ARR, tech stack, executive team
- Best outreach channel: Email + LinkedIn
- Reference: `industries/saas.md`

## 8. Cultural Adaptations

### Vietnam
- Use bilingual outreach (English + Vietnamese)
- Prefer WhatsApp over email
- Avoid Tet holiday (late Jan/Feb)
- Use Mr./Ms. + given name (not family name)
- See `regions/vietnam.md` for full cultural guide

### China
- Use WeChat for B2B communication
- Bilingual (English + Simplified Chinese)
- Avoid Chinese New Year (late Jan/Feb)
- Reference WeChat ID in outreach

### Brazil
- Use Portuguese for outreach (English less common)
- Prefer WhatsApp (universal in Brazil)
- Avoid Carnival (February)
- Use formal Portuguese ("Senhor/Senhora")

### Germany
- Use German for first contact (shows respect)
- Be formal ("Sie" form, "Herr/Frau [Last Name]")
- Detailed technical specifications
- Emphasize data privacy / GDPR compliance

## 9. Compliance Checklist

Before running this playbook:

- ✅ User has provided product + country (clear query)
- ✅ Industry is not sanctioned (no Iran, North Korea, etc.)
- ✅ User has consented to data collection (LeadReach ToS)
- ✅ Knowledge base has relevant industry + region files
- ✅ Data sources are healthy (`/api/data-sources/health`)
- ✅ User is within their plan's query quota

During execution:

- ✅ Personal data minimization (collect only business contact info)
- ✅ Source attribution for every data point
- ✅ Honor opt-outs / suppression list
- ✅ Don't collect special category data (health, religion, politics)

After execution:

- ✅ Provide audit trail (sources cited)
- ✅ Allow user to edit/delete prospects (GDPR)
- ✅ Forward qualified leads to Leads section
- ✅ Generate campaign report

## 10. Success Metrics

A successful run of this playbook should achieve:

- **Coverage**: 50-500 prospects found (depending on industry size)
- **Quality**: >50% have verified contact info (phone OR email)
- **Geographic distribution**: Matches actual industry distribution (not skewed to one city)
- **Deduplication accuracy**: <5% duplicates in final list
- **Total time**: <10 minutes for end-to-end pipeline
- **User satisfaction**: User can immediately act on results (export to CRM, start outreach)

## 11. Adaptation for Different Query Types

### Variant A: "Suppliers" (exporters from country)
- Use this playbook as-is
- Focus on export-oriented channels (trade directories, customs data)

### Variant B: "Distributors" (importers to country)
- Invert the geography: find importers in destination country
- Use different channels (national importer associations, port authority data)

### Variant C: "Manufacturers" (producers in country)
- Focus on factory-level data
- Filter out trading companies
- Use factory certifications (ISO 9001) and physical address verification

### Variant D: "Service Providers" (B2B services in country)
- Use LinkedIn more heavily
- Use professional associations
- Different data points (no MOQ, no certifications — focus on client portfolio, case studies)
