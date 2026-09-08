import type { AgentDetailFull } from './types';

export const dataEnrichmentDetail: AgentDetailFull = {
  slug: 'data-enrichment',
  name: 'data-enrichment',
  displayName: 'Data Enrichment (Forge)',
  tagline: 'Transforms raw leads into rich, actionable profiles with 60+ fields',
  description: 'Enriches lead data with firmographics, contacts, and digital presence',
  longDescription:
    'The Data Enrichment agent — codenamed Forge — takes raw prospect data (just a company name and website) and transforms it into a comprehensive profile with 60+ fields across 8 categories: Identity, Location, Contact, People, Firmographic, Digital, Financial, and Scoring. Forge uses a 5-step enrichment pipeline: web research (z-ai web_search + page_reader to read company websites) → LLM field extraction (structured extraction via GLM models at temperature 0.2 for precision) → LinkedIn company search (employee count, industry, HQ) → industry classification (SIC/NAICS code assignment across 28+ industries) → 5-dimension lead scoring (firmographic 25%, intent 20%, reachability 20%, strategic 20%, data completeness 15%) with tier assignment (cold / warm / hot / super_hot). The Smart Auto-Fill feature fills every empty field with a single click — per-lead or in batches of up to 50 leads with a 1-second cooldown between leads. The merge-not-overwrite strategy ensures zero data loss: only fields with actual non-null values from the enrichment result are written, and every enriched field carries a source URL for downstream verification. Forge never fabricates data — unknown fields are left null rather than guessed.',
  color: '#3B82F6',
  iconName: 'Database',
  department: 'Growth',
  pipelineRole: 'Deep data enrichment and profile building',
  pipelinePosition: 3,

  capabilities: [
    {
      name: '60+ Field Enrichment (8 Categories)',
      description:
        'Fills 60+ structured fields across 8 categories — Identity, Location, Contact, People, Firmographic, Digital, Financial, Scoring — using web research, LLM extraction, LinkedIn, and industry classification. Each field carries a source URL for verification.',
      metric: '60+ fields',
      details: [
        'Identity (8 fields): legal_name, trade_name, domain, parent_company, founded_year, company_type, ticker_symbol, description.',
        'Location (10 fields): hq_address, hq_city, hq_state, hq_postal, hq_country, hq_latitude, hq_longitude, office_count, regions_active, timezone.',
        'Contact (7 fields): phone, email_pattern, support_email, linkedin_url, twitter_handle, facebook_url, primary_contact_url.',
        'People (8 fields): ceo_name, ceo_title, ceo_linkedin, founder_count, leadership_count, board_count, key_decision_makers, hr_contact.',
        'Firmographic (10 fields): employee_count, employee_range, industry, sub_industry, sic_code, naics_code, company_stage, ownership_type, last_funding_date, last_funding_amount.',
        'Digital (8 fields): tech_stack, cms, hosting_provider, analytics_tools, marketing_tools, languages_supported, mobile_app, ssl_issuer.',
        'Financial (7 fields): annual_revenue, revenue_range, revenue_currency, growth_rate_yoy, total_funding, valuation, fiscal_year_end.',
        'Scoring (5 fields): lead_score, lead_tier, score_drivers, score_explanation, score_version.',
      ],
    },
    {
      name: 'Smart Auto-Fill',
      description:
        'One-click feature that fills ALL empty fields on a lead using the full 5-step enrichment pipeline. Available per-lead (button on the lead card) or in batch mode (up to 50 leads with a 1-second cooldown between leads to respect upstream rate limits).',
      metric: 'One-click fill',
      details: [
        'Per-lead mode: triggered from the lead card; runs the 5-step pipeline end-to-end for that single lead and merges results.',
        'Batch mode: triggered from the campaign detail page ("Smart Auto-Fill All Leads"); processes up to 50 leads sequentially with a 1-second cooldown between leads.',
        'Batch prioritization: leads with the lowest data_completeness percentage are processed first, maximizing the impact of each batch.',
        'Progress streaming: each lead\'s enrichment progress is streamed to the UI via SSE so the operator sees real-time fills.',
      ],
    },
    {
      name: '5-Step Enrichment Pipeline',
      description:
        'Each enrichment runs through a deterministic 5-step pipeline: web research → LLM field extraction → LinkedIn company search → industry classification (SIC/NAICS) → 5-dimension scoring. Each step adds data and confidence.',
      metric: '5-step pipeline',
      details: [
        'Step 1 — Web Research: z-ai web_search returns 5 results about the company; page_reader extracts the first 5000 characters of the company website for primary-source data.',
        'Step 2 — LLM Field Extraction: GLM-4.6v-flash at temperature 0.2 extracts structured field values from the research context using a JSON-schema-constrained prompt that yields 40+ fields.',
        'Step 3 — LinkedIn Company Search: queries LinkedIn\'s company endpoint to retrieve the LinkedIn URL, employee count, declared industry, and HQ location.',
        'Step 4 — Industry Classification: matches the detected industry against a 28+ industry keyword catalog and assigns the corresponding SIC code and NAICS code.',
        'Step 5 — 5-Dimension Scoring: computes a 0–100 lead score across 5 weighted dimensions and assigns a tier (cold < 40, warm 40–69, hot 70–87, super_hot 88+).',
      ],
    },
    {
      name: 'Merge-Not-Overwrite Strategy',
      description:
        'Only writes fields with actual non-null values from the enrichment result. Existing data is never lost when enrichment doesn\'t return all fields — the merge function preserves every prior non-null value and only updates fields where the new value is non-null.',
      metric: 'Zero data loss',
      details: [
        'The merge function compares each incoming field value against the existing value; only non-null incoming values are written, and existing non-null values are preserved.',
        'Field-level source tracking: each merged field records the source URL, source channel, and merge timestamp so the data lineage is fully auditable.',
        'Conflict resolution: if both existing and incoming values are non-null, the existing value wins (preserving user-curated data) unless "force_refresh=true" is passed.',
        'A merge audit log entry is written for every field that changed, every field that was preserved, and every field that was newly populated.',
      ],
    },
    {
      name: 'Industry Classification (SIC/NAICS, 28+ Industries)',
      description:
        'Automatically assigns SIC and NAICS industry codes based on detected industry. Covers 28+ industry categories with keyword matching plus semantic matching via the LLM. Refines the coarse industry hint from Prospect Discovery into precise SIC and NAICS codes.',
      metric: '28+ industries',
      details: [
        '28+ industry categories: Technology, Financial Services, Healthcare, Manufacturing, Retail, Education, Media, Energy, Real Estate, Transportation, Hospitality, Construction, Legal, Marketing, Consulting, Telecommunications, Agriculture, Government, Non-Profit, Aerospace, Automotive, Pharmaceuticals, Biotech, Consumer Goods, E-commerce, Fashion, Food & Beverage, Logistics.',
        'Two-tier matching: keyword matcher (deterministic, fast) first; if confidence < 0.6, the LLM is asked to classify from the research context.',
        'Each industry category maps to a primary SIC code (4-digit) and a primary NAICS code (6-digit); sub-industries refine to a more specific code.',
        'False positives are logged to a monthly tuning queue; the keyword catalog is refreshed monthly based on observed misclassifications.',
      ],
    },
    {
      name: '5-Dimension Lead Scoring',
      description:
        'Computes a 0–100 lead score across 5 weighted dimensions: firmographic (25%), intent (20%), reachability (20%), strategic (20%), and data completeness (15%). Each dimension is computed from the enriched fields and contributes a weighted sub-score to the final 0–100 lead score.',
      metric: '5-dimension score',
      details: [
        'Firmographic (25%): industry match to ICP, employee-count match, geography match, revenue-range match.',
        'Intent (20%): trigger events (funding, hiring, product launches), tech-stack adoption signals, content-engagement signals.',
        'Reachability (20%): email availability, phone availability, LinkedIn presence, identified decision-maker.',
        'Strategic (20%): market position, growth trajectory (YoY), partnership potential, strategic alignment with seller\'s ICP.',
        'Data completeness (15%): percentage of 60+ fields populated; bonus for fields with verified source URLs.',
      ],
    },
    {
      name: 'Tier Assignment',
      description:
        'Maps the 0–100 lead score to one of 4 tiers: cold (< 40), warm (40–69), hot (70–87), super_hot (88+). Tiers drive downstream routing — super_hot and hot leads receive priority outreach, warm leads enter nurture, cold leads are parked for periodic re-evaluation.',
      metric: '4 tiers',
      details: [
        'cold (< 40): parked; re-evaluated weekly for score decay / signal-driven upgrades.',
        'warm (40–69): entered into the nurture sequence; eligible for low-touch outreach.',
        'hot (70–87): prioritized for outreach within 48 hours; assigned to the senior AE rotation.',
        'super_hot (88+): prioritized for outreach within 24 hours; flagged for human review and ABM-style high-touch sequence.',
      ],
    },
    {
      name: 'Batch Processing (50 Leads, 1s Cooldown)',
      description:
        'Processes up to 50 leads in a single batch with a 1-second cooldown between leads to respect upstream API rate limits. Prioritizes leads with the lowest data completeness first so that each batch delivers the maximum possible uplift.',
      metric: '50 leads/batch',
      details: [
        'Batch size capped at 50 leads per run to keep wall-clock time under 10 minutes and per-run token cost predictable.',
        '1-second cooldown between leads prevents 429s from z-ai web_search, page_reader, and LinkedIn APIs.',
        'Per-lead progress is streamed to the UI; failed leads within a batch do not abort the batch — they are logged and the batch continues.',
        'A batch summary is emitted at the end: leads processed, leads upgraded, total fields filled, total cost, latency p50/p99.',
      ],
    },
    {
      name: 'Source URL Verification',
      description:
        'Every enriched field carries a source URL pointing to the page or API call that produced the value. Operators can click any field to verify the underlying source — building trust and enabling fast correction of stale data.',
      metric: 'Per-field source',
      details: [
        'Each field in the Lead record stores {value, source_url, source_channel, captured_at, confidence} in a JSONB column.',
        'Source URL is the canonical page from which the LLM extracted the value (company website, LinkedIn page, Exa result, etc.).',
        'Low-confidence fields (confidence < 0.5) are visually flagged in the UI for manual review.',
        'Stale fields (captured_at older than 90 days) are flagged for re-enrichment on the next batch run.',
      ],
    },
    {
      name: 'JSON-Schema-Constrained Extraction',
      description:
        'LLM field extraction uses a strict JSON schema (response_format: json_schema) so the model returns a structured object with the 60+ fields typed and named exactly as the Lead Prisma model expects. No prose, no markdown, no hallucinated keys.',
      metric: 'Strict schema',
      details: [
        'The JSON schema enumerates every field with its TypeScript type (string, number, integer, enum, nullable).',
        'Extra keys returned by the LLM are silently dropped by the validator; missing keys default to null.',
        'Temperature is pinned to 0.2 to maximize determinism; the same input + prompt yields the same output across runs.',
        'Schema validation failures (rare) trigger a single retry with a tighter prompt that re-emphasizes the required shape.',
      ],
    },
    {
      name: 'Data Completeness Computation',
      description:
        'After every enrichment run, Forge recomputes the lead\'s data_completeness percentage — the fraction of the 60+ fields that are non-null. This drives batch prioritization, tier-eligibility checks, and the UI\'s progress ring on each lead card.',
      metric: 'Real-time %',
      details: [
        'Completeness = (non_null_fields / total_fields) × 100, computed across all 60+ schema fields excluding internal metadata.',
        'Verified-source fields (those with a populated source_url) count double in a "verified_completeness" sub-metric.',
        'Leads below 30% completeness are flagged for priority re-enrichment on the next batch run.',
        'The metric is recomputed after every merge so the UI always shows the live value.',
      ],
    },
    {
      name: 'Never Fabricate Discipline',
      description:
        'Forge never fabricates data. When a field cannot be determined from the research context, the LLM is instructed to return null rather than guess. This preserves data integrity and prevents downstream scoring from being poisoned by hallucinated values.',
      metric: 'Zero fabrication',
      details: [
        'The system prompt explicitly forbids fabrication: "If you cannot determine a field with confidence from the provided context, return null. Never guess. Never extrapolate."',
        'Post-extraction validator flags suspicious patterns (round numbers, repeated values, generic strings like "N/A" or "various") for review.',
        'Fields that the LLM returns as null are persisted as null; they are eligible for re-enrichment on subsequent runs.',
        'A fabrication-rate metric (fields rejected as suspicious / total fields returned) is tracked per run; sustained spikes trigger a prompt review.',
      ],
    },
  ],

  pipelineStages: [
    {
      stage: 'Web Research',
      inputs: ['Company name', 'Website URL', 'Existing lead hint object'],
      outputs: ['5 web search results', 'Company website content (5000 chars)', 'Search snippets'],
      duration: '5–10 seconds',
      substeps: [
        'Build the search query: "{{company_name}} {{website_domain}} company revenue employees CEO industry".',
        'Call z-ai web_search with the query; collect top 5 results with title, URL, snippet.',
        'Call z-ai page_reader on the company website URL; extract the first 5000 characters of clean text.',
        'If page_reader returns < 1000 chars (JS-rendered site), retry once with the about/careers subpath.',
        'Concatenate search snippets + page content into the research_context string passed to the LLM.',
        'Persist the research_context to the lead\'s enrichment_log for auditability.',
      ],
      errorHandling: 'If web_search returns 0 results, fall back to a query using only the company name. If page_reader times out, use only the search snippets for extraction.',
      retryStrategy: '2 retries with 1s backoff on web_search 429; 1 retry with about-subpath on page_reader low-content.',
    },
    {
      stage: 'LLM Field Extraction',
      inputs: ['Research context', 'Empty field list', 'JSON schema'],
      outputs: ['Extracted field values (40+ fields)', 'Per-field source URLs', 'Confidence scores'],
      duration: '3–8 seconds',
      substeps: [
        'Build the extraction prompt: system prompt + research context + the 60+ field schema (JSON Schema format).',
        'Call GLM-4.6v-flash at temperature 0.2 with response_format=json_schema to force structured output.',
        'Validate the returned JSON against the schema; drop unknown keys, default missing keys to null.',
        'Run the suspicious-value detector on every returned field (round numbers, generic strings, repeated patterns).',
        'Tag each non-null field with its source URL (best-effort attribution to the most relevant search result or the company website).',
        'Compute per-field confidence (0.0–1.0) from snippet relevance and source authority.',
      ],
      errorHandling: 'On JSON parse failure, retry once with a tighter prompt that re-emphasizes the required shape and forbids prose. On second failure, persist the partial extraction (whichever fields parsed) and flag the lead for re-enrichment.',
      retryStrategy: '1 retry with patched prompt; on second failure, persist partial and mark for re-enrichment.',
    },
    {
      stage: 'LinkedIn Company Search',
      inputs: ['Company name', 'Website domain'],
      outputs: ['LinkedIn URL', 'Employee count', 'Declared industry', 'HQ location'],
      duration: '3–5 seconds',
      substeps: [
        'Query the LinkedIn company search endpoint with the company name (and website domain as a disambiguator).',
        'If multiple matches, pick the one whose website matches the lead\'s domain; if no website match, pick the highest-employee-count match.',
        'Retrieve the company profile: linkedin_url, employee_count, employee_range, declared_industry, hq_city, hq_country.',
        'Cross-check declared_industry against the LLM-extracted industry; if they diverge, prefer the LinkedIn value for industry and log the divergence.',
        'Append LinkedIn data to the extraction result; LinkedIn-sourced fields override LLM-extracted values when both are non-null.',
      ],
      errorHandling: 'If LinkedIn returns 0 matches, skip this step and rely on LLM-extracted values. If LinkedIn returns 401, disable the LinkedIn channel and notify the operator.',
      retryStrategy: '2 retries with 2s backoff on 429; on 401, disable channel; on 404, no retry (company not in LinkedIn).',
    },
    {
      stage: 'Industry Classification (SIC/NAICS)',
      inputs: ['Detected industry (from LLM or LinkedIn)', 'Research context'],
      outputs: ['SIC code (4-digit)', 'NAICS code (6-digit)', 'Sub-industry label'],
      duration: '< 1 second',
      substeps: [
        'Run the keyword matcher against the detected industry string using the 28+ industry keyword catalog.',
        'If keyword match confidence >= 0.6, assign the corresponding SIC code, NAICS code, and sub-industry label.',
        'If keyword match confidence < 0.6, ask the LLM to classify from the research context using a focused prompt.',
        'Cross-check the assigned SIC/NAICS against the LLM-extracted industry; if they diverge, prefer the keyword-matcher value (deterministic) and log the divergence.',
        'Persist sic_code, naics_code, sub_industry to the Lead record with source_url pointing to the classification reference.',
      ],
      errorHandling: 'If both keyword matcher and LLM return no classification, leave sic_code and naics_code null and flag the lead for manual industry tagging.',
      retryStrategy: 'No retry — classification is deterministic for keyword matches; LLM retry uses the patched-prompt path.',
    },
    {
      stage: '5-Dimension Scoring',
      inputs: ['All enriched fields', 'Campaign ICP definition'],
      outputs: ['Lead score (0–100)', 'Tier (cold/warm/hot/super_hot)', 'Score drivers', 'Score explanation'],
      duration: '2–5 seconds',
      substeps: [
        'Compute firmographic sub-score (0–100) from industry match, employee-count match, geography match, revenue-range match against the ICP.',
        'Compute intent sub-score (0–100) from trigger events, tech-stack signals, content-engagement signals.',
        'Compute reachability sub-score (0–100) from email availability, phone availability, LinkedIn presence, decision-maker identification.',
        'Compute strategic sub-score (0–100) from market position, growth trajectory, partnership potential, strategic alignment.',
        'Compute data completeness sub-score (0–100) from the percentage of 60+ fields populated plus a bonus for verified-source fields.',
        'Compute the weighted sum: firmographic×0.25 + intent×0.20 + reachability×0.20 + strategic×0.20 + data_completeness×0.15 = final 0–100 lead score.',
        'Map the lead score to a tier: cold (< 40), warm (40–69), hot (70–87), super_hot (88+). Persist score, tier, score_drivers, score_explanation.',
      ],
      errorHandling: 'If any sub-score cannot be computed (missing required fields), default that dimension to 0 and note the gap in score_explanation.',
      retryStrategy: 'No retry — scoring is deterministic given the enriched fields.',
    },
    {
      stage: 'Merge & Persist',
      inputs: ['Extraction result', 'LinkedIn data', 'Industry classification', 'Lead score', 'Existing Lead record'],
      outputs: ['Updated Lead record', 'Merge audit log entries', 'Data completeness percentage'],
      duration: '< 1 second',
      substeps: [
        'Load the existing Lead record from Postgres.',
        'For each field in the enrichment result, compare the incoming value against the existing value.',
        'If incoming is non-null and existing is null: write the incoming value, attach source URL, capture merge timestamp.',
        'If both are non-null: preserve the existing value (unless force_refresh=true), log the conflict.',
        'If incoming is null: leave the existing value untouched, log that the field was not enriched this run.',
        'Recompute data_completeness percentage across all 60+ fields; persist the new value.',
        'Write merge audit log entries: per-field changes, per-field preservations, total fields filled, total fields preserved.',
      ],
      errorHandling: 'If the DB write fails, queue the merge result in-memory and retry 3 times with 200ms backoff; if still failing, surface to the operator and preserve the in-memory result for the next run.',
      retryStrategy: '3 retries with 200ms exponential backoff on DB write; persistent failures escalate to the orchestrator.',
    },
  ],

  knowledgeBase: [
    {
      title: 'Smart Auto-Fill & Field Enrichment SOP',
      category: 'SOP',
      summary:
        'Complete procedure for the 5-step Smart Auto-Fill pipeline: web research, LLM extraction, LinkedIn search, industry classification, and 5-dimension scoring. Defines per-lead vs batch invocation, the merge-not-overwrite rule, and source-URL attribution.',
      sections: 14,
      owner: 'Growth Engineering',
      lastReviewed: '2026-08-25',
      version: '3.2.0',
      sectionList: [
        { title: '1. Purpose & Scope', description: 'Defines what Smart Auto-Fill does, when it is invoked per-lead vs batch, and which fields are in scope.' },
        { title: '2. Pipeline Overview', description: 'The 5-step pipeline: web research → LLM extraction → LinkedIn → industry classification → scoring → merge.' },
        { title: '3. Web Research Sub-Procedure', description: 'Query construction, web_search call, page_reader call, research_context assembly, low-content retry.' },
        { title: '4. LLM Extraction Sub-Procedure', description: 'Prompt assembly, JSON schema enforcement, temperature 0.2, validation, suspicious-value detection.' },
        { title: '5. LinkedIn Sub-Procedure', description: 'Company search, disambiguation, profile retrieval, channel-disable on 401.' },
        { title: '6. Industry Classification Sub-Procedure', description: 'Keyword matcher, LLM fallback at confidence < 0.6, SIC/NAICS assignment.' },
        { title: '7. Scoring Sub-Procedure', description: '5-dimension computation, weighted sum, tier mapping, score_explanation authoring.' },
        { title: '8. Merge-Not-Overwrite Rule', description: 'Field-by-field comparison, conflict resolution, force_refresh escape hatch, audit log requirements.' },
        { title: '9. Batch Mode Discipline', description: '50-lead cap, 1-second cooldown, completeness-first prioritization, SSE progress streaming.' },
        { title: '10. Source URL Attribution', description: 'How source URLs are attached to fields, how confidence is computed, how low-confidence is flagged.' },
        { title: '11. Failure Handling', description: 'JSON parse failure, LinkedIn 401, DB write failure — each has a documented recovery path.' },
        { title: '12. Audit Log Requirements', description: 'Which events must be logged and the minimum field set for each enrichment audit entry.' },
        { title: '13. Quality Spot-Checks', description: 'Weekly spot-check procedure: sample 20 leads, verify source URLs, flag fabrication.' },
        { title: '14. Revision History', description: 'Change log of the SOP across versions, including rationale for major changes.' },
      ],
    },
    {
      title: 'Enrichment Data Quality Runbook',
      category: 'Runbook',
      summary:
        'Handles enrichment failures, stale data, source outages, and data accuracy issues with specific remediation steps. Includes the LLM-fabrication detector, the LinkedIn auth flow, and the re-enrichment queue.',
      sections: 14,
      owner: 'Site Reliability',
      lastReviewed: '2026-09-02',
      version: '2.3.0',
      sectionList: [
        { title: '1. Web Research Failure', description: 'Detection: web_search returns 0 results. Mitigation: query simplification, fallback to name-only, page_reader direct.' },
        { title: '2. LLM JSON Parse Failure', description: 'Detection: response_format validator rejects. Mitigation: patched-prompt retry, partial-persist, flag for re-enrichment.' },
        { title: '3. LLM Fabrication Detection', description: 'Detection: suspicious-value detector flags round numbers / repeated values. Mitigation: field quarantine, prompt review.' },
        { title: '4. LinkedIn 401 Unauthorized', description: 'Detection: LinkedIn returns 401. Mitigation: token refresh; if persistent, disable channel and notify operator.' },
        { title: '5. LinkedIn 429 Rate Limit', description: 'Detection: LinkedIn returns 429. Mitigation: 2 retries with backoff; persistent 429s disable channel for 15 min.' },
        { title: '6. LinkedIn Company Not Found', description: 'Detection: 0 matches or no website-domain disambiguator match. Mitigation: skip LinkedIn step, rely on LLM-extracted values.' },
        { title: '7. Industry Classification Conflict', description: 'Detection: keyword matcher and LLM disagree. Mitigation: prefer keyword matcher (deterministic), log divergence.' },
        { title: '8. Stale Data Detection', description: 'Detection: captured_at older than 90 days. Mitigation: queue for re-enrichment on next batch run.' },
        { title: '9. Source URL Dead-Link Check', description: 'Detection: periodic link-check job finds 4xx/5xx source URLs. Mitigation: re-enrich the affected fields.' },
        { title: '10. DB Write Failure', description: 'Detection: Postgres write returns error. Mitigation: 3 retries with 200ms backoff; in-memory queue fallback.' },
        { title: '11. Batch Partial Failure', description: 'Detection: N of 50 leads fail in a batch. Mitigation: log failures, continue batch, summarize at end.' },
        { title: '12. Token Budget Exceeded', description: 'Detection: cumulative token cost exceeds the per-batch cap. Mitigation: pause batch, surface to operator.' },
        { title: '13. User Notification Templates', description: 'Pre-written user-facing comms for common enrichment failure scenarios.' },
        { title: '14. Post-Incident Review Template', description: '5-whys template for any enrichment failure that affected > 5 leads.' },
      ],
    },
    {
      title: 'Data Enrichment Strategy Playbook',
      category: 'Playbook',
      summary:
        'Strategic framework for enrichment prioritization, field-importance weighting, and data-freshness management. Defines which fields to enrich first for which ICPs and when to trigger re-enrichment.',
      sections: 13,
      owner: 'Growth Strategy',
      lastReviewed: '2026-08-12',
      version: '1.6.0',
      sectionList: [
        { title: '1. Field Importance Tiers', description: 'Tier 1 (must-have): name, domain, industry, employee_count, HQ. Tier 2 (high-value): revenue, CEO, tech_stack. Tier 3 (nice-to-have): board, fiscal_year_end.' },
        { title: '2. ICP-Specific Enrichment Plans', description: 'Enterprise ICP: prioritize People + Financial. SMB ICP: prioritize Contact + Digital. Local ICP: prioritize Location.' },
        { title: '3. Data Freshness SLAs', description: 'Tier-1 fields: refreshed every 30 days. Tier-2: every 90 days. Tier-3: every 180 days.' },
        { title: '4. Re-Enrichment Triggers', description: 'Manual refresh, scheduled refresh, signal-driven refresh (new funding, new executive hire).' },
        { title: '5. Source Authority Ranking', description: 'Primary source (company website) > LinkedIn > Exa > z-ai web_search > Reddit.' },
        { title: '6. Confidence Thresholds', description: 'Field confidence < 0.5: flag for review. < 0.3: do not persist (treat as null).' },
        { title: '7. Conflict Resolution Policy', description: 'When two sources disagree: prefer primary-source > secondary; if same tier, prefer more recent.' },
        { title: '8. Verification Procedures', description: 'How to spot-check enriched data; how to verify phone/email via NeverBounce.' },
        { title: '9. Enrichment Cost Optimization', description: 'When to use the cheaper glm-4.5-air model vs the default glm-4.6v-flash; batch sizing trade-offs.' },
        { title: '10. Data Completeness Targets', description: 'Per-ICP completeness targets: Enterprise 80%+, SMB 60%+, Local 50%+.' },
        { title: '11. ABM-Style High-Touch Enrichment', description: 'For super_hot leads: deeper manual enrichment with analyst reports, SEC filings, press releases.' },
        { title: '12. Sunset Criteria', description: 'When to retire a lead\'s enriched data (e.g. acquired, dissolved, ICP-exit).' },
        { title: '13. Reporting for Enrichment Quality', description: 'Weekly enrichment-quality report: completeness distribution, source-coverage, fabrication rate.' },
      ],
    },
    {
      title: 'Lead Data Model Reference (60+ Fields)',
      category: 'Reference',
      summary:
        'Complete specification of the Lead Prisma model with all 60+ fields, types, nullable status, default values, and enrichment sources. The canonical schema used by the LLM extraction prompt.',
      sections: 14,
      owner: 'Growth Engineering',
      lastReviewed: '2026-08-30',
      version: '4.1.0',
      sectionList: [
        { title: '1. Model Overview', description: 'The Lead model has 60+ fields across 8 categories; each field stores {value, source_url, captured_at, confidence}.' },
        { title: '2. Identity Fields', description: 'legal_name, trade_name, domain, parent_company, founded_year, company_type, ticker_symbol, description.' },
        { title: '3. Location Fields', description: 'hq_address, hq_city, hq_state, hq_postal, hq_country, hq_latitude, hq_longitude, office_count, regions_active, timezone.' },
        { title: '4. Contact Fields', description: 'phone, email_pattern, support_email, linkedin_url, twitter_handle, facebook_url, primary_contact_url.' },
        { title: '5. People Fields', description: 'ceo_name, ceo_title, ceo_linkedin, founder_count, leadership_count, board_count, key_decision_makers, hr_contact.' },
        { title: '6. Firmographic Fields', description: 'employee_count, employee_range, industry, sub_industry, sic_code, naics_code, company_stage, ownership_type, last_funding_date, last_funding_amount.' },
        { title: '7. Digital Fields', description: 'tech_stack, cms, hosting_provider, analytics_tools, marketing_tools, languages_supported, mobile_app, ssl_issuer.' },
        { title: '8. Financial Fields', description: 'annual_revenue, revenue_range, revenue_currency, growth_rate_yoy, total_funding, valuation, fiscal_year_end.' },
        { title: '9. Scoring Fields', description: 'lead_score, lead_tier, score_drivers, score_explanation, score_version.' },
        { title: '10. Internal Metadata Fields', description: 'data_completeness, verified_completeness, last_enriched_at, enrichment_count, enrichment_log (JSONB).' },
        { title: '11. Field-Level Source Tracking', description: 'How each field\'s source_url, captured_at, confidence are stored in a JSONB sidecar column.' },
        { title: '12. Nullable Defaults', description: 'All enrichment fields default to null; only id, campaign_id, name, website are required at creation.' },
        { title: '13. Schema Migration Procedure', description: 'How to add a new field without downtime (add nullable, backfill in batches, then enforce).' },
        { title: '14. Performance Benchmarks', description: 'Latest benchmarks: full 60+ field load in 80ms; indexed queries on lead_tier p95 < 30ms.' },
      ],
    },
    {
      title: 'Forge Onboarding & Enrichment Mastery Training',
      category: 'Training',
      summary:
        'Comprehensive onboarding for the Forge agent covering the enrichment pipeline, data sources, quality standards, the merge-not-overwrite rule, and Smart Auto-Fill operation.',
      sections: 14,
      owner: 'Agent Operations',
      lastReviewed: '2026-07-28',
      version: '2.1.0',
      sectionList: [
        { title: '1. Welcome & Mission', description: 'Forge\'s mission: turn raw leads (name + website) into rich profiles that maximize downstream scoring accuracy.' },
        { title: '2. The 5-Step Pipeline', description: 'Walkthrough of each pipeline step with hands-on exercises.' },
        { title: '3. Field Schema Familiarization', description: 'Memorize the 8 categories and 60+ fields; practice identifying which category a field belongs to.' },
        { title: '4. Prompt Engineering Workshop', description: 'How to write the JSON-schema-constrained extraction prompt; common pitfalls.' },
        { title: '5. Source URL Attribution', description: 'How source URLs are attached; how to verify them; how to handle dead links.' },
        { title: '6. Merge-Not-Overwrite Discipline', description: 'Why preservation > overwriting; how to handle conflicts; when to use force_refresh.' },
        { title: '7. Industry Classification Practice', description: 'Practice classifying 50 sample companies across 28+ industries using both keyword matcher and LLM.' },
        { title: '8. 5-Dimension Scoring Walkthrough', description: 'Step-by-step computation of each dimension; how to write score_explanation.' },
        { title: '9. Smart Auto-Fill (Per-Lead)', description: 'Hands-on: trigger per-lead auto-fill on 10 sample leads; review results.' },
        { title: '10. Smart Auto-Fill (Batch of 50)', description: 'Hands-on: trigger a 50-lead batch; observe 1-second cooldown; review batch summary.' },
        { title: '11. Quality Spot-Checks', description: 'How to perform the weekly spot-check; how to identify fabrication patterns.' },
        { title: '12. Common Failure Modes', description: 'Walkthroughs of 5 representative failure scenarios (LinkedIn 401, LLM JSON parse, DB write, etc.).' },
        { title: '13. Certification Exam', description: '25-question exam covering the pipeline, schema, scoring, merge discipline, and failure handling.' },
        { title: '14. Continuing Education', description: 'Monthly brown-bag on new data sources, schema additions, and prompt improvements.' },
      ],
    },
    {
      title: 'Industry Classification & SIC/NAICS Playbook',
      category: 'Playbook',
      summary:
        'How Forge classifies companies into 28+ industries and assigns SIC and NAICS codes. Defines the keyword matcher, the LLM fallback, the divergence-resolution policy, and the monthly tuning cycle.',
      sections: 10,
      owner: 'Growth Engineering',
      lastReviewed: '2026-08-18',
      version: '1.4.0',
      sectionList: [
        { title: '1. The 28+ Industry Catalog', description: 'Complete list of industries with their primary SIC codes and NAICS codes.' },
        { title: '2. Keyword Matcher Design', description: 'How the keyword matcher is built (industry → keywords list) and how confidence is computed.' },
        { title: '3. LLM Fallback Trigger', description: 'Confidence < 0.6 triggers LLM classification from research context with a focused prompt.' },
        { title: '4. Divergence Resolution', description: 'When keyword matcher and LLM disagree: prefer keyword matcher (deterministic); log divergence.' },
        { title: '5. Sub-Industry Refinement', description: 'How a primary industry is refined to a sub-industry (e.g. "Technology" → "DevTools").' },
        { title: '6. Monthly Tuning Cycle', description: 'How false positives are logged, reviewed monthly, and folded back into the keyword catalog.' },
        { title: '7. SIC vs NAICS Selection', description: 'When to use 4-digit SIC vs 6-digit NAICS; how to handle industries without clean SIC mapping.' },
        { title: '8. Cross-Border Industry Codes', description: 'How non-US industries are mapped; UK SIC, EU NACE considerations.' },
        { title: '9. Audit Trail for Classification', description: 'Which fields are logged for each classification event (input, matcher output, LLM output, final).' },
        { title: '10. Quality Benchmarks', description: 'Target: 95%+ classification accuracy on the monthly spot-check sample.' },
      ],
    },
  ],

  tools: [
    {
      name: 'z-ai web_search',
      type: 'SDK',
      description:
        'Web search for company information (revenue, employees, CEO, HQ). Returns top 5 results with title, URL, snippet, and relevance score. Powers step 1 of the enrichment pipeline.',
      status: 'connected',
      endpoint: 'z-ai-web-dev-sdk.web_search',
      authMethod: 'API key (ZAI_API_KEY)',
      rateLimit: '100 req/min',
      config: [
        { key: 'top_k', value: '5' },
        { key: 'parallel', value: 'true' },
        { key: 'timeout', value: '10s' },
        { key: 'retry_budget', value: '2' },
      ],
      schemaExample:
        '{"query":"Acme Corp revenue employees CEO industry"} → {"results":[{"title":"Acme Corp - Crunchbase","url":"https://crunchbase.com/acme","snippet":"Acme Corp is a SaaS company...","relevance":0.92}]}',
      failureMode: 'On 429, backs off to half rate for 5 minutes; persistent 429s disable the SDK for 15 minutes.',
    },
    {
      name: 'z-ai page_reader',
      type: 'SDK',
      description:
        'Reads the first 5000 characters of the company website for primary-source extraction. Strips navigation, ads, and boilerplate to yield clean text. Powers step 1 of the pipeline.',
      status: 'connected',
      endpoint: 'z-ai-web-dev-sdk.page_reader',
      authMethod: 'API key (ZAI_API_KEY)',
      rateLimit: '60 req/min',
      config: [
        { key: 'max_chars', value: '5000' },
        { key: 'strip_boilerplate', value: 'true' },
        { key: 'timeout', value: '12s' },
        { key: 'fallback_subpath', value: '/about,/careers' },
      ],
      schemaExample:
        '{"url":"https://acme.com"} → {"content":"Acme Corp is the leading provider of... founded in 2015... headquartered in San Francisco...","chars":4823,"fetched_at":"2026-09-08T14:23:00Z"}',
      failureMode: 'JS-rendered sites return < 1000 chars; retry once with /about subpath before giving up.',
    },
    {
      name: 'LLM (GLM-4.6v-flash)',
      type: 'SDK',
      description:
        'Structured field extraction from the research context using GLM-4.6v-flash at temperature 0.2 with response_format=json_schema. Returns 40+ fields per call. Powers step 2 of the pipeline.',
      status: 'connected',
      endpoint: 'z-ai-web-dev-sdk.chat.completions',
      authMethod: 'API key (ZAI_API_KEY)',
      rateLimit: '120 req/min',
      config: [
        { key: 'model', value: 'glm-4.6v-flash' },
        { key: 'temperature', value: '0.2' },
        { key: 'max_tokens', value: '3000' },
        { key: 'response_format', value: 'json_schema' },
        { key: 'top_p', value: '0.9' },
      ],
      schemaExample:
        '{"messages":[{"role":"system","content":"You are FORGE..."},{"role":"user","content":"Research context: ..."}],"response_format":{"type":"json_schema","json_schema":{"schema":{"type":"object","properties":{"legal_name":{"type":"string"},"domain":{"type":"string"},"annual_revenue":{"type":"number"}}}}}} → {"legal_name":"Acme Corp","domain":"acme.com","annual_revenue":42000000}',
      failureMode: 'On JSON parse failure, retry once with tighter prompt; on second failure, persist partial and flag for re-enrichment.',
    },
    {
      name: 'LinkedIn Company Search',
      type: 'API',
      description:
        'Finds the LinkedIn company page and retrieves employee count, declared industry, and HQ location. Provides high-authority data for firmographic fields. Powers step 3 of the pipeline.',
      status: 'available',
      endpoint: 'https://api.linkedin.com/v2/companies',
      authMethod: 'OAuth2 (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET)',
      rateLimit: '500 req/day (basic), 5000 req/day (Sales Navigator)',
      config: [
        { key: 'oauth_flow', value: 'authorization_code' },
        { key: 'scope', value: 'r_organization_social,r_basicprofile' },
        { key: 'disambiguator', value: 'website_domain' },
        { key: 'timeout', value: '8s' },
      ],
      schemaExample:
        'INPUT: {"keywords":"Acme Corp","website":"acme.com"} → OUTPUT: {"name":"Acme Corp","linkedin_url":"https://linkedin.com/company/acme","employee_count":450,"employee_range":"201-500","industry":"Software","hq_city":"San Francisco","hq_country":"US"}',
      failureMode: 'On 401, refresh token; if persistent, disable channel and notify operator. On 404, skip LinkedIn step.',
    },
    {
      name: 'NeverBounce Email Validation',
      type: 'API',
      description:
        'Validates contact email addresses extracted by the LLM to confirm deliverability before they are persisted. Reduces bounce rate on downstream outreach. Called only when an email is extracted.',
      status: 'available',
      endpoint: 'https://api.neverbounce.com/v4/single/check',
      authMethod: 'API key (NEVERBOUNCE_API_KEY)',
      rateLimit: '1000 req/hour (free tier), 10000 req/hour (paid)',
      config: [
        { key: 'timeout', value: '5s' },
        { key: 'accept_on_uncertain', value: 'true' },
        { key: 'flag_uncertain', value: 'true' },
      ],
      schemaExample:
        'INPUT: {"email":"ceo@acme.com"} → OUTPUT: {"result":"valid","flags":["has_dns","has_mx"],"suggested_correction":null}',
      failureMode: 'On API outage, persist the email with a pending_validation flag and retry on the next batch.',
    },
    {
      name: 'Industry Classification Engine',
      type: 'Internal',
      description:
        '28+ industry keyword matcher with LLM fallback. Maps detected industry to SIC code (4-digit) and NAICS code (6-digit). Powers step 4 of the pipeline.',
      status: 'connected',
      endpoint: 'internal://industry_classifier',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'catalog_size', value: '28 industries' },
        { key: 'confidence_threshold', value: '0.6' },
        { key: 'fallback_model', value: 'glm-4.6v-flash' },
      ],
      schemaExample:
        'INPUT: {"industry":"DevTools","context":"Acme builds developer collaboration tools..."} → OUTPUT: {"sic_code":"7372","naics_code":"5112","sub_industry":"Developer Tools","confidence":0.84,"source":"keyword_matcher"}',
      failureMode: 'Returns null sic/naics when both matcher and LLM fail; lead flagged for manual tagging.',
    },
    {
      name: '5-Dimension Scorer',
      type: 'Internal',
      description:
        'Computes the 0–100 lead score across 5 weighted dimensions (firmographic 25%, intent 20%, reachability 20%, strategic 20%, data completeness 15%) and assigns a tier. Powers step 5 of the pipeline.',
      status: 'connected',
      endpoint: 'internal://scorer',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'weights', value: 'firmographic:0.25,intent:0.20,reachability:0.20,strategic:0.20,data_completeness:0.15' },
        { key: 'tier_thresholds', value: 'cold<40,warm 40-69,hot 70-87,super_hot 88+' },
        { key: 'completeness_bonus', value: '0.1 per verified-source field (capped at 10)' },
      ],
      schemaExample:
        'INPUT: {"firmographic":85,"intent":60,"reachability":90,"strategic":70,"data_completeness":75} → OUTPUT: {"score":77,"tier":"hot","drivers":["strong_reachability","good_firmographic_fit"],"explanation":"Strong reachability (email+phone+LinkedIn) and firmographic fit offset middling intent signals."}',
      failureMode: 'If any dimension is null (missing data), default to 0 and note the gap in score_explanation.',
    },
    {
      name: 'Field Merger',
      type: 'Internal',
      description:
        'Implements the merge-not-overwrite strategy. Compares each incoming field against the existing value; only writes non-null incoming values; preserves existing non-null values. Writes per-field merge audit log entries.',
      status: 'connected',
      endpoint: 'internal://field_merger',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'preserve_existing', value: 'true' },
        { key: 'force_refresh_default', value: 'false' },
        { key: 'source_url_required', value: 'true' },
        { key: 'audit_log_required', value: 'true' },
      ],
      schemaExample:
        'INPUT: {"existing":{"phone":"+1-555-0100"},"incoming":{"phone":null,"email":"ceo@acme.com"}} → OUTPUT: {"phone":"+1-555-0100","email":"ceo@acme.com"},"audit":[{"field":"phone","action":"preserved"},{"field":"email","action":"written"}]}',
      failureMode: 'If audit log write fails, the merge is rolled back and retried 3 times before escalating.',
    },
    {
      name: 'Lead DB Persister',
      type: 'Internal',
      description:
        'Writes the merged Lead record back to Postgres with all enriched fields, source URLs, captured_at timestamps, and recomputed data_completeness. Uses a transaction to ensure atomic writes.',
      status: 'connected',
      endpoint: 'internal://lead_persister',
      authMethod: 'in-process',
      rateLimit: '500 writes/s',
      config: [
        { key: 'target_table', value: 'leads' },
        { key: 'transaction', value: 'true' },
        { key: 'retry_budget', value: '3' },
        { key: 'backoff_base', value: '200ms' },
      ],
      schemaExample:
        'INPUT: {"lead_id":"l_8842","fields":{"phone":"+1-555-0100","email":"ceo@acme.com"},"source_urls":{"email":"https://acme.com/team"},"captured_at":"2026-09-08T14:23:00Z"} → OUTPUT: {"written":true,"lead_id":"l_8842","data_completeness":72.5}',
      failureMode: 'On DB write failure, queue in-memory and retry 3 times with 200ms backoff; persistent failures escalate.',
    },
    {
      name: 'Source URL Tracker',
      type: 'Internal',
      description:
        'Maintains a JSONB sidecar column on the Lead record storing {value, source_url, captured_at, confidence} for every enriched field. Enables the UI\'s click-to-verify feature and the periodic dead-link check job.',
      status: 'connected',
      endpoint: 'internal://source_tracker',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'sidecar_column', value: 'enrichment_log' },
        { key: 'dead_link_check_interval', value: '7d' },
        { key: 'stale_threshold', value: '90d' },
      ],
      schemaExample:
        'INPUT: {"lead_id":"l_8842","field":"email","value":"ceo@acme.com","source_url":"https://acme.com/team","confidence":0.92} → OUTPUT: {"recorded":true,"captured_at":"2026-09-08T14:23:00Z"}',
      failureMode: 'Sidecar write failures are logged but do not block the main Lead write; the field is persisted without source tracking.',
    },
  ],

  metrics: [
    {
      label: 'Fields Filled per Lead',
      value: '40+',
      unit: 'fields',
      benchmark: 'Target: > 25',
      trend30d: '+3 fields',
      description: 'Average number of fields populated per enrichment run, across the 60+ field schema.',
    },
    {
      label: 'Enrichment Latency (p50)',
      value: '24',
      unit: 'seconds',
      benchmark: 'Target: < 30s',
      trend30d: '-2s',
      description: 'Median wall-clock time for a single-lead enrichment run end-to-end.',
    },
    {
      label: 'Enrichment Latency (p99)',
      value: '58',
      unit: 'seconds',
      benchmark: 'Target: < 60s',
      trend30d: '-4s',
      description: '99th percentile enrichment latency; reflects the slowest 1% of runs (typically LinkedIn-heavy or page_reader-slow).',
    },
    {
      label: 'Data Completeness (post-fill)',
      value: '72.4',
      unit: '%',
      benchmark: 'Target: > 60%',
      trend30d: '+4.1%',
      description: 'Average percentage of 60+ fields populated after Smart Auto-Fill runs.',
    },
    {
      label: 'Verified Completeness',
      value: '54.8',
      unit: '%',
      benchmark: 'Target: > 50%',
      trend30d: '+3.6%',
      description: 'Percentage of fields populated with a verified source URL attached.',
    },
    {
      label: 'Batch Throughput',
      value: '50',
      unit: 'leads/batch',
      benchmark: 'Max: 50',
      trend30d: 'stable',
      description: 'Maximum number of leads enriched in a single batch with 1-second cooldown between leads.',
    },
    {
      label: 'Tier Upgrade Rate',
      value: '31.2',
      unit: '%',
      benchmark: 'Target: > 20%',
      trend30d: '+2.4%',
      description: 'Percentage of leads whose tier increased (e.g. cold → warm) after enrichment.',
    },
    {
      label: 'LLM Field Accuracy',
      value: '94.6',
      unit: '%',
      benchmark: 'Target: > 90%',
      trend30d: '+0.8%',
      description: 'Percentage of LLM-extracted fields that pass the weekly spot-check for accuracy.',
    },
    {
      label: 'Merge Preservation Rate',
      value: '100',
      unit: '%',
      benchmark: 'Target: 100%',
      trend30d: 'stable',
      description: 'Percentage of pre-existing non-null fields preserved across an enrichment run (zero data loss).',
    },
    {
      label: 'Source URL Coverage',
      value: '88.2',
      unit: '%',
      benchmark: 'Target: > 80%',
      trend30d: '+1.5%',
      description: 'Percentage of enriched fields with a populated source_url for verification.',
    },
    {
      label: 'Industry Classification Accuracy',
      value: '95.3',
      unit: '%',
      benchmark: 'Target: > 95%',
      trend30d: '+0.6%',
      description: 'Percentage of SIC/NAICS classifications that match the monthly spot-check ground truth.',
    },
    {
      label: 'Smart Auto-Fill Success Rate',
      value: '97.8',
      unit: '%',
      benchmark: 'Target: > 95%',
      trend30d: '+0.4%',
      description: 'Percentage of Smart Auto-Fill invocations (per-lead or batch) that complete without escalation.',
    },
    {
      label: 'Fabrication Rejection Rate',
      value: '0.4',
      unit: '%',
      benchmark: 'Target: < 1%',
      trend30d: '-0.1%',
      description: 'Percentage of LLM-returned fields rejected by the suspicious-value detector.',
    },
    {
      label: 'Per-Lead Token Cost',
      value: '$0.018',
      unit: 'USD',
      benchmark: 'Target: < $0.03',
      trend30d: '-$0.002',
      description: 'Average LLM + API cost incurred per enriched lead.',
    },
  ],

  config: {
    model: 'glm-4.6v-flash',
    temperature: 0.2,
    maxTokens: 3000,
    scheduleType: 'always_on',
    maxConcurrentTasks: 5,
    priority: 'high',
    reasoningEffort: 'medium',
    topP: 0.9,
    presencePenalty: 0,
    frequencyPenalty: 0,
    stopSequences: [],
    responseFormat: 'json_schema',
    jsonSchema:
      '{"type":"object","properties":{"legal_name":{"type":["string","null"]},"trade_name":{"type":["string","null"]},"domain":{"type":["string","null"]},"parent_company":{"type":["string","null"]},"founded_year":{"type":["integer","null"]},"company_type":{"type":["string","null"]},"ticker_symbol":{"type":["string","null"]},"description":{"type":["string","null"]},"hq_address":{"type":["string","null"]},"hq_city":{"type":["string","null"]},"hq_state":{"type":["string","null"]},"hq_postal":{"type":["string","null"]},"hq_country":{"type":["string","null"]},"hq_latitude":{"type":["number","null"]},"hq_longitude":{"type":["number","null"]},"office_count":{"type":["integer","null"]},"regions_active":{"type":"array","items":{"type":"string"}},"timezone":{"type":["string","null"]},"phone":{"type":["string","null"]},"email_pattern":{"type":["string","null"]},"support_email":{"type":["string","null"]},"linkedin_url":{"type":["string","null"]},"twitter_handle":{"type":["string","null"]},"facebook_url":{"type":["string","null"]},"primary_contact_url":{"type":["string","null"]},"ceo_name":{"type":["string","null"]},"ceo_title":{"type":["string","null"]},"ceo_linkedin":{"type":["string","null"]},"founder_count":{"type":["integer","null"]},"leadership_count":{"type":["integer","null"]},"board_count":{"type":["integer","null"]},"employee_count":{"type":["integer","null"]},"employee_range":{"type":["string","null"]},"industry":{"type":["string","null"]},"sub_industry":{"type":["string","null"]},"sic_code":{"type":["string","null"]},"naics_code":{"type":["string","null"]},"annual_revenue":{"type":["number","null"]},"revenue_range":{"type":["string","null"]},"revenue_currency":{"type":["string","null"]},"growth_rate_yoy":{"type":["number","null"]},"total_funding":{"type":["number","null"]},"last_funding_date":{"type":["string","null"]},"last_funding_amount":{"type":["number","null"]},"valuation":{"type":["number","null"]},"fiscal_year_end":{"type":["string","null"]},"tech_stack":{"type":"array","items":{"type":"string"}},"cms":{"type":["string","null"]},"hosting_provider":{"type":["string","null"]},"analytics_tools":{"type":"array","items":{"type":"string"}},"marketing_tools":{"type":"array","items":{"type":"string"}}},"required":["legal_name","domain"]}',
    timeout: '45s',
    retryPolicy: '2 retries per pipeline step with exponential backoff base 1.5s',
    fallbackModel: 'glm-4.5-air',
    systemPromptSummary:
      'You are FORGE, the Data Enrichment Agent. You take raw leads (name + website) and fill 60+ fields across 8 categories using web research, LLM extraction, LinkedIn search, and industry classification. You never fabricate data — use null for unknown fields. You merge, never overwrite. You compute a 5-dimension lead score and assign a tier.',
    systemPromptFull: `You are FORGE, the Data Enrichment Agent of the LeadReach AI platform. Your mission is to transform raw leads — sometimes nothing more than a company name and a website URL — into rich, structured profiles with 60+ fields across 8 categories (Identity, Location, Contact, People, Firmographic, Digital, Financial, Scoring). You operate as the third stage of the pipeline, downstream of Scout (Prospect Discovery) and upstream of Judge (Lead Qualification) and Sage (Web Research). Everything downstream — scoring accuracy, outreach personalization, reporting fidelity — depends on the quality, breadth, and verifiability of the data you produce.

# IDENTITY & AUTHORITY
You operate with full authority over the Lead record's enriched fields. You have authority over:
- Field extraction: which fields to populate and with what values.
- Source attribution: which source URL is attached to each field.
- Confidence scoring: the per-field confidence value (0.0 to 1.0) that flags fields for human review.
- Industry classification: the SIC code, NAICS code, and sub-industry label assigned to the lead.
- Lead scoring: the 0–100 lead score computed from the enriched fields and the campaign ICP.
- Tier assignment: the cold / warm / hot / super_hot tier derived from the lead score.
- Merge decisions: whether to write, preserve, or skip each field during the merge step.

You do NOT have authority over:
- Lead creation or deletion (that is the orchestrator's call).
- The 60+ field schema itself (that is owned by the Lead Data Model Reference; you populate it, you do not change it).
- Campaign settings or ICP definitions (those are user-authored).
- Outreach content (that is Bard's domain).

When you encounter a situation not covered by your decision framework — for example, a field that requires a value judgment outside the schema — you must escalate to the orchestrator via the task.escalated event. Do not improvise beyond your authority boundaries.

# CORE OPERATING LOOP
You operate on a per-lead loop with the following phases:

1. WEB RESEARCH — Receive the lead (name + website) and the campaign ICP. Build a search query "{{company_name}} {{website_domain}} company revenue employees CEO industry". Call z-ai web_search and collect the top 5 results with title, URL, snippet. Call z-ai page_reader on the company website URL and extract the first 5000 characters of clean text. If page_reader returns fewer than 1000 characters (likely a JS-rendered site), retry once with the /about subpath. Concatenate the search snippets and page content into the research_context string that will be passed to the LLM.

2. LLM FIELD EXTRACTION — Build the extraction prompt: system prompt + research_context + the 60+ field JSON schema. Call GLM-4.6v-flash at temperature 0.2 with response_format=json_schema to force a structured response. The temperature is pinned to 0.2 for precision — the same input + prompt should yield the same output across runs. Validate the returned JSON against the schema; drop unknown keys and default missing keys to null. Run the suspicious-value detector on every returned field to catch fabricated values (round numbers, repeated values, generic strings like "N/A" or "various"). Tag each non-null field with its source URL (best-effort attribution to the most relevant search result or the company website) and compute a per-field confidence from snippet relevance and source authority.

3. LINKEDIN COMPANY SEARCH — Query the LinkedIn company search endpoint with the company name (using the website domain as a disambiguator). If multiple matches, pick the one whose website matches the lead's domain; if no website match, pick the highest-employee-count match. Retrieve the company profile: linkedin_url, employee_count, employee_range, declared_industry, hq_city, hq_country. Cross-check declared_industry against the LLM-extracted industry; if they diverge, prefer the LinkedIn value for industry and log the divergence. LinkedIn-sourced fields override LLM-extracted values when both are non-null because LinkedIn is treated as higher authority.

4. INDUSTRY CLASSIFICATION — Run the keyword matcher against the detected industry using the 28+ industry keyword catalog. If the keyword match confidence is >= 0.6, assign the corresponding SIC code, NAICS code, and sub-industry label. If confidence is < 0.6, ask the LLM to classify from the research context using a focused prompt. Cross-check the assigned SIC/NAICS against the LLM-extracted industry; if they diverge, prefer the keyword-matcher value (deterministic) and log the divergence. Persist sic_code, naics_code, and sub_industry to the Lead record with a source_url pointing to the classification reference.

5. 5-DIMENSION SCORING — Compute five sub-scores (each 0 to 100) from the enriched fields and the campaign ICP: firmographic (industry match, employee-count match, geography match, revenue-range match), intent (trigger events, tech-stack signals, content-engagement signals), reachability (email availability, phone availability, LinkedIn presence, decision-maker identification), strategic (market position, growth trajectory, partnership potential, strategic alignment), and data completeness (percentage of 60+ fields populated, with a bonus for verified-source fields). Compute the weighted sum: firmographic * 0.25 + intent * 0.20 + reachability * 0.20 + strategic * 0.20 + data_completeness * 0.15 = final 0–100 lead score. Map the score to a tier: cold (< 40), warm (40–69), hot (70–87), super_hot (88+). Persist lead_score, lead_tier, score_drivers, score_explanation, and score_version.

6. MERGE & PERSIST — Load the existing Lead record from Postgres. For each field in the enrichment result, compare the incoming value against the existing value. If the incoming value is non-null and the existing value is null, write the incoming value, attach the source URL, and capture the merge timestamp. If both are non-null, preserve the existing value (unless force_refresh=true) and log the conflict. If the incoming value is null, leave the existing value untouched and log that the field was not enriched this run. Recompute the data_completeness percentage across all 60+ fields and persist the new value. Write merge audit log entries for every field that changed, every field that was preserved, and every field that was newly populated.

# DECISION FRAMEWORK
When you face a decision during enrichment, apply the following framework:

- When two sources disagree on a field value, prefer the higher-authority source. The source authority ranking is: primary source (company website) > LinkedIn > Exa > z-ai web_search > Reddit. If both sources are at the same authority tier, prefer the more recent value.
- When a field's confidence is below 0.5, flag it for human review in the UI but still persist the value. When confidence is below 0.3, do not persist the value; treat it as null.
- When the LLM returns a value that the suspicious-value detector flags (round numbers, repeated values, generic strings), quarantine the field and log it for prompt review. Do not persist quarantined values.
- When the lead's data_completeness is below 30%, prioritize re-enrichment on the next batch run.
- When a field's captured_at timestamp is older than 90 days, queue it for re-enrichment on the next batch run regardless of completeness.
- When you cannot determine a field with confidence from the research context, return null. Never guess. Never extrapolate. Never fabricate.

# FAILURE MODES
Be aware of your own failure modes and design around them:
- Fabrication under ambiguity: when the LLM is uncertain, it sometimes produces plausible-sounding but fabricated values (e.g. a made-up revenue figure). The temperature of 0.2, the JSON-schema constraint, and the suspicious-value detector together suppress this, but you must remain vigilant. If the fabrication rate (fields rejected / total returned) exceeds 1%, trigger a prompt review.
- Source over-reliance: if the company website is sparse, the LLM may extract from low-authority search snippets. When the page_reader returns < 1000 characters, treat all extracted fields as lower confidence (subtract 0.2 from each).
- Stale data: enriched fields decay. A company that was Series B 90 days ago may now be Series C. Honor the 90-day re-enrichment trigger and re-extract fields even if they are non-null.
- LinkedIn dependency: when LinkedIn is unavailable (401, 429, 404), the firmographic fields lose their highest-authority source. Do not block the enrichment; fall back to LLM-extracted values and flag the lead for LinkedIn re-enrichment when the channel recovers.
- Merge drift: under concurrent enrichment runs (rare but possible in batch mode), the merge step can race. Always wrap the load-modify-write in a Postgres transaction with row locking.

# AUDIT & EXPLAINABILITY
Every enrichment event must be auditable. For each lead enrichment run, the following must be recorded in the enrichment_log JSONB sidecar column:
- The enrichment_run_id (UUID).
- The pipeline step that produced each field (web_research, llm_extraction, linkedin, industry_classification, scoring, merge).
- The source_url for each field.
- The captured_at timestamp.
- The confidence value.
- The merge action (written, preserved, skipped).

The user must be able to ask "why does this lead have this revenue figure?" and receive a reconstructed answer: which source URL, which pipeline step, which confidence, captured when. There are no exceptions to this requirement. The Source URL Tracker tool enforces this — fields without a source_url are flagged and not eligible for the verified_completeness bonus in scoring.

# FINAL GUARDRAILS
1. Never fabricate data. If a field cannot be determined with confidence from the research context, return null. The system prompt explicitly forbids guessing and extrapolation.
2. Never overwrite a non-null existing field with a null incoming value. The merge-not-overwrite rule is non-negotiable; existing user-curated data is sacred.
3. Never persist a field without a source_url. Source attribution is mandatory for verification and trust.
4. Never skip the suspicious-value detector. Even with temperature 0.2 and a JSON schema, the LLM can hallucinate; the detector is the last line of defense.
5. Never exceed the 50-lead batch cap or skip the 1-second cooldown. Both exist to respect upstream rate limits and keep wall-clock time predictable.
6. Always recompute data_completeness after every merge so the UI shows the live value.
7. Always persist score_explanation alongside lead_score and lead_tier so the user can understand why a lead was scored the way it was.
8. Always emit lead.enriched event when enrichment completes so downstream agents (Judge, Sage, Bard) can react.

You are FORGE. You operate with precision, discipline, and transparency. You never fabricate. You merge, never overwrite. You attach a source to every value. You score with rigor and explain with clarity. Your success is measured by the accuracy, completeness, and verifiability of the lead profiles you produce, and you optimize relentlessly for those qualities.`,
  },

  channels: ['Web', 'LinkedIn', 'Exa Search', 'Twitter/X', 'GitHub', 'NeverBounce'],
  dependencies: ['orchestrator', 'prospect-discovery'],

  faqs: [
    {
      question: 'How accurate is the enriched data?',
      answer:
        'Data extracted from company websites via page_reader is highly accurate because it comes from the primary source. LLM-extracted data from web search results is reliable but should be verified for critical fields (phone numbers, email addresses, revenue estimates). The system never fabricates data — if a field cannot be determined with confidence, it is left null. Every enriched field carries a source URL for one-click verification in the UI, and low-confidence fields (below 0.5) are visually flagged for manual review.',
    },
    {
      question: 'What is the Smart Auto-Fill feature?',
      answer:
        'Smart Auto-Fill is a one-click feature that fills ALL empty fields on a lead. It uses the 5-step pipeline: web research (z-ai web_search + page_reader), LLM extraction (40+ fields at temperature 0.2 with JSON-schema enforcement), LinkedIn company search, industry classification (SIC/NAICS), and 5-dimension scoring. It is available per-lead (a button on each lead card) or in batch mode ("Smart Auto-Fill All Leads" on the campaign detail page, processing up to 50 leads with a 1-second cooldown between leads).',
    },
    {
      question: 'How does the merge-not-overwrite strategy work?',
      answer:
        'When enrichment returns data, only fields with actual non-null values are written. If a lead already has a phone number but the enrichment does not find one, the existing phone number is preserved. If both the existing value and the incoming value are non-null, the existing value wins (preserving user-curated data) unless force_refresh=true is passed. This guarantees zero data loss across enrichment runs and is enforced by the Field Merger tool, which writes a per-field audit log entry for every change, preservation, and skip.',
    },
    {
      question: 'What are the 5 scoring dimensions and their weights?',
      answer:
        'The 5 dimensions are: firmographic (25%, weighted by industry/employee/geography/revenue match to ICP), intent (20%, weighted by trigger events, tech-stack signals, content engagement), reachability (20%, weighted by email/phone/LinkedIn/decision-maker availability), strategic (20%, weighted by market position, growth trajectory, partnership potential), and data completeness (15%, weighted by percentage of 60+ fields populated plus a bonus for verified-source fields). The weighted sum yields a 0–100 lead score mapped to tiers: cold < 40, warm 40–69, hot 70–87, super_hot 88+.',
    },
    {
      question: 'What happens when a field cannot be determined from the research context?',
      answer:
        'Forge never fabricates data. The system prompt explicitly forbids guessing and extrapolation: "If you cannot determine a field with confidence from the provided context, return null." The LLM returns null for that field, the merge step skips it, and the field is eligible for re-enrichment on subsequent runs. The suspicious-value detector also catches fabricated-looking values (round numbers, repeated values, generic strings) and quarantines them rather than persisting them.',
    },
    {
      question: 'How does Forge handle a batch of 50 leads without tripping rate limits?',
      answer:
        'Batch mode processes leads sequentially with a 1-second cooldown between leads. The cooldown gives z-ai web_search, page_reader, and the LinkedIn API time to recover between calls. Within a single lead, the pipeline steps run sequentially but each step has its own retry budget (2 retries with 1.5s backoff on 429s). If a lead fails within the batch, the batch does not abort — the failed lead is logged and the batch continues with the next lead. A batch summary at the end reports leads processed, leads upgraded, total fields filled, and total cost.',
    },
    {
      question: 'How does industry classification work and what if it is wrong?',
      answer:
        'Forge uses a two-tier matcher: a keyword matcher against a 28+ industry catalog (deterministic and fast) runs first. If the keyword confidence is below 0.6, the LLM is asked to classify from the research context using a focused prompt. The chosen industry is mapped to a primary SIC code (4-digit) and NAICS code (6-digit). When the keyword matcher and LLM disagree, the keyword matcher wins (deterministic) and the divergence is logged. False positives are collected in a monthly tuning queue and the keyword catalog is refreshed monthly based on observed misclassifications.',
    },
  ],

  // ────────────────────────────────────────────────────────────────────
  // PROMPT-LEVEL ARTIFACTS
  // ────────────────────────────────────────────────────────────────────

  userPromptTemplates: [
    {
      name: 'Per-lead Smart Auto-Fill',
      useCase: 'Operator clicks the Smart Auto-Fill button on a single lead card.',
      template: `Enrich lead {{leadId}}.

Known fields:
- Company name: {{companyName}}
- Website: {{websiteUrl}}
- Existing data completeness: {{currentCompleteness}}%

Run the full 5-step pipeline:
1. Web research (z-ai web_search + page_reader on the company website).
2. LLM field extraction (60+ field schema, temperature 0.2, JSON-schema-constrained).
3. LinkedIn company search (employee count, industry, HQ).
4. Industry classification (SIC/NAICS, 28+ industries).
5. 5-dimension scoring (firmographic 25%, intent 20%, reachability 20%, strategic 20%, data completeness 15%).

Merge with merge-not-overwrite semantics. Attach a source URL to every enriched field. Return the final lead score, tier, and a summary of fields filled.`,
      variables: ['leadId', 'companyName', 'websiteUrl', 'currentCompleteness'],
    },
    {
      name: 'Batch Smart Auto-Fill (campaign)',
      useCase: 'Operator clicks "Smart Auto-Fill All Leads" on the campaign detail page.',
      template: `Batch enrich up to {{batchSize}} leads for campaign {{campaignId}}.

Prioritization: leads with the lowest data_completeness percentage first.
Cooldown: 1 second between leads (rate-limit safety).
Force refresh: {{forceRefresh | false}}

For each lead, run the full 5-step pipeline:
1. Web research.
2. LLM field extraction.
3. LinkedIn company search.
4. Industry classification.
5. 5-dimension scoring.

Merge with merge-not-overwrite (unless force_refresh=true). Stream per-lead progress via SSE. On per-lead failure, log and continue the batch. Return a batch summary: leads processed, leads upgraded (tier increased), total fields filled, total cost, latency p50/p99.`,
      variables: ['batchSize', 'campaignId', 'forceRefresh'],
    },
    {
      name: 'Re-enrichment (stale data)',
      useCase: 'Operator wants to re-enrich leads whose data is older than the freshness SLA.',
      template: `Re-enrich leads for campaign {{campaignId}} where last_enriched_at < {{cutoffDate}}.

Stale threshold: {{staleDays | 90}} days
Force refresh: true (override merge-not-overwrite for stale fields)
Batch size: {{batchSize | 50}}

Run the full 5-step pipeline on each stale lead. Override existing field values where the new value is non-null and source-authority is equal or higher. Recompute data_completeness and lead_score. Return the list of re-enriched leads with old vs new completeness and old vs new tier.`,
      variables: ['campaignId', 'cutoffDate', 'staleDays', 'batchSize'],
    },
    {
      name: 'Single-field refresh',
      useCase: 'Operator wants to refresh a single field on a lead (e.g. revenue was wrong).',
      template: `Refresh a single field on lead {{leadId}}.

Field: {{fieldName}}
Force refresh: true (override existing value)
Source preference: {{sourcePreference | "primary_first"}}

Run only the steps needed to extract {{fieldName}} (typically web research + LLM extraction). Merge with force_refresh=true so the new value overrides the existing value. Return the old value, the new value, the source URL, and the new confidence.`,
      variables: ['leadId', 'fieldName', 'sourcePreference'],
    },
    {
      name: 'Enrichment quality query',
      useCase: 'Operator asks about enrichment quality across a campaign.',
      template: `Report enrichment quality for campaign {{campaignId}}.

Window: {{window | "last_30d"}}
Detail: {{detail | "summary" | "per_field" | "per_source"}}

Return:
- Average data_completeness (and verified_completeness).
- Tier distribution (cold / warm / hot / super_hot counts).
- Top 5 fields most-often null (enrichment gaps).
- Top 5 sources by field coverage.
- Fabrication rejection rate.
- Per-lead token cost (avg, p50, p99).`,
      variables: ['campaignId', 'window', 'detail'],
    },
    {
      name: 'Industry reclassification',
      useCase: 'Operator notices an industry was misclassified and asks Forge to reclassify.',
      template: `Reclassify industry for lead {{leadId}}.

Detected misclassification: {{currentIndustry}} (suspected actual: {{suspectedIndustry}})
Force refresh: true

Re-run step 4 of the pipeline with the suspected industry as a hint. Update sic_code, naics_code, sub_industry. Recompute lead_score (firmographic dimension may change). Return the old and new classification, the old and new score, and the audit trail for the reclassification.`,
      variables: ['leadId', 'currentIndustry', 'suspectedIndustry'],
    },
  ],

  toolCallExamples: [
    {
      tool: 'z-ai page_reader',
      scenario: 'Reading the first 5000 characters of a company website for primary-source extraction.',
      request: `{
  "url": "https://acme.com",
  "max_chars": 5000,
  "strip_boilerplate": true,
  "timeout": 12
}`,
      response: `{
  "url": "https://acme.com",
  "content": "Acme Corp is the leading provider of developer collaboration tools. Founded in 2015 and headquartered in San Francisco, Acme serves over 2,000 customers including Fortune 500 enterprises. Our platform integrates with GitHub, GitLab, and Bitbucket...",
  "chars": 4823,
  "fetched_at": "2026-09-08T14:23:00Z",
  "boilerplate_stripped": true
}`,
      notes: 'If chars < 1000 (JS-rendered site), Forge retries once with /about subpath before giving up and relying on search snippets only.',
    },
    {
      tool: 'LLM (GLM-4.6v-flash)',
      scenario: 'Structured field extraction from research context using JSON-schema-constrained output at temperature 0.2.',
      request: `{
  "model": "glm-4.6v-flash",
  "temperature": 0.2,
  "max_tokens": 3000,
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "schema": {
        "type": "object",
        "properties": {
          "legal_name": { "type": ["string", "null"] },
          "domain": { "type": ["string", "null"] },
          "founded_year": { "type": ["integer", "null"] },
          "hq_city": { "type": ["string", "null"] },
          "annual_revenue": { "type": ["number", "null"] },
          "employee_count": { "type": ["integer", "null"] },
          "industry": { "type": ["string", "null"] }
        },
        "required": ["legal_name", "domain"]
      }
    }
  },
  "messages": [
    { "role": "system", "content": "You are FORGE, the Data Enrichment Agent. Extract fields from the research context. Return ONLY valid JSON matching the schema. If a field cannot be determined with confidence, return null. Never fabricate." },
    { "role": "user", "content": "Research context: Acme Corp is the leading provider of developer collaboration tools. Founded in 2015 and headquartered in San Francisco, Acme serves over 2,000 customers including Fortune 500 enterprises. Annual revenue is approximately $42M with 450 employees..." }
  ]
}`,
      response: `{
  "legal_name": "Acme Corp",
  "domain": "acme.com",
  "founded_year": 2015,
  "hq_city": "San Francisco",
  "annual_revenue": 42000000,
  "employee_count": 450,
  "industry": "Technology"
}`,
      notes: 'Temperature 0.2 maximizes determinism. response_format=json_schema enforces structured output. Suspicious-value detector runs on every field post-extraction.',
    },
    {
      tool: '5-Dimension Scorer',
      scenario: 'Computing the lead score from enriched fields and mapping to a tier.',
      request: `{
  "lead_id": "l_8842",
  "firmographic": 85,
  "intent": 60,
  "reachability": 90,
  "strategic": 70,
  "data_completeness": 75,
  "icp_definition": {
    "industry": "Technology",
    "employee_range": "200-1000",
    "geography": "US",
    "revenue_range": "$10M-$100M"
  }
}`,
      response: `{
  "lead_id": "l_8842",
  "score": 77,
  "tier": "hot",
  "weights": {
    "firmographic": 0.25,
    "intent": 0.20,
    "reachability": 0.20,
    "strategic": 0.20,
    "data_completeness": 0.15
  },
  "weighted_breakdown": {
    "firmographic": 21.25,
    "intent": 12.0,
    "reachability": 18.0,
    "strategic": 14.0,
    "data_completeness": 11.25
  },
  "drivers": [
    "strong_reachability",
    "good_firmographic_fit",
    "verified_completeness_bonus"
  ],
  "explanation": "Strong reachability (email + phone + LinkedIn + identified CEO) and good firmographic fit (Technology industry, 450 employees, US-based, $42M revenue in ICP range) offset middling intent signals. Tier: hot (70-87).",
  "score_version": "v4.2.1"
}`,
      notes: 'Tier thresholds: cold < 40, warm 40-69, hot 70-87, super_hot 88+. score_explanation is persisted alongside the score for auditability.',
    },
  ],

  examples: [
    {
      scenario: 'Smart Auto-Fill on a raw lead with only name + website.',
      input: `Enrich lead l_8842. Company name: "Acme Corp". Website: "https://acme.com". Existing data_completeness: 8% (only name + website populated).`,
      reasoning: `Lead has minimal data — only name and website. Run the full 5-step pipeline. Step 1: web_search for "Acme Corp acme.com company revenue employees CEO industry" returns 5 results including a Crunchbase page and a TechCrunch article. page_reader extracts 4823 chars from acme.com including mission, founding year, HQ. Step 2: GLM-4.6v-flash at temperature 0.2 with JSON-schema constraint returns 42 fields. Suspicious-value detector passes all 42 (no round numbers, no repeated values, no generic strings). Step 3: LinkedIn company search returns employee_count=450, declared_industry="Software", hq_city="San Francisco". Step 4: keyword matcher classifies "Software" → SIC 7372, NAICS 5112, sub_industry "Developer Tools" with confidence 0.84. Step 5: scoring produces score=77, tier=hot. Step 6: merge writes 42 new fields, preserves the 2 existing fields (name, website), recomputes data_completeness to 72.5%.`,
      output: `{
  "lead_id": "l_8842",
  "enrichment_run_id": "er_4f2a",
  "fields_filled": 42,
  "fields_preserved": 2,
  "fields_skipped": 16,
  "data_completeness_before": 8.0,
  "data_completeness_after": 72.5,
  "verified_completeness_after": 58.3,
  "lead_score": 77,
  "lead_tier": "hot",
  "score_drivers": ["strong_reachability", "good_firmographic_fit", "verified_completeness_bonus"],
  "industry_classification": {
    "industry": "Technology",
    "sub_industry": "Developer Tools",
    "sic_code": "7372",
    "naics_code": "5112",
    "confidence": 0.84
  },
  "linkedin_overrides_applied": 3,
  "source_url_coverage": 0.88,
  "fabrication_rejections": 0,
  "latency_seconds": 22.4,
  "token_cost_usd": 0.018
}`,
      outcome: 'Lead l_8842 upgraded from incomplete to hot tier. Judge (Lead Qualification) agent picked it up within 30 seconds of the lead.enriched event and routed it to the senior AE rotation for outreach within 48 hours.',
    },
    {
      scenario: 'Batch Smart Auto-Fill on 50 leads with a partial failure.',
      input: `Batch enrich 50 leads for campaign c_412. Prioritize lowest data_completeness first. Cooldown: 1 second between leads.`,
      reasoning: `Sort 50 leads by data_completeness ascending. Process sequentially with 1-second cooldown. Lead 1 (completeness 8%): full pipeline succeeds, 42 fields filled, upgraded cold → hot. Lead 2 (completeness 12%): LinkedIn returns 401 (token expired) — skip LinkedIn step, LLM-extracted values used, 38 fields filled, upgraded cold → warm. Lead 3 (completeness 14%): LLM returns malformed JSON — retry once with patched prompt succeeds, 40 fields filled. ... Lead 47 (completeness 35%): page_reader times out on the company website (JS-rendered) — extraction from search snippets only, 28 fields filled, flagged for re-enrichment. ... Lead 50 (completeness 41%): full pipeline succeeds. Batch summary: 50 leads processed, 1 LinkedIn channel disabled mid-batch (leads 2-50 used LLM-only industry), 0 leads aborted, 38 tier upgrades, 1,847 total fields filled, 0 fabrications rejected, total cost $0.91, p50 latency 23s, p99 latency 51s.`,
      output: `{
  "batch_id": "b_8842",
  "campaign_id": "c_412",
  "leads_processed": 50,
  "leads_succeeded": 50,
  "leads_aborted": 0,
  "tier_upgrades": 38,
  "tier_unchanged": 11,
  "tier_downgrades": 1,
  "total_fields_filled": 1847,
  "avg_completeness_before": 18.4,
  "avg_completeness_after": 67.8,
  "fabrication_rejections": 0,
  "channel_events": [
    { "channel": "linkedin", "event": "disabled", "at_lead": 2, "reason": "401_unauthorized" }
  ],
  "latency": {
    "p50_seconds": 23,
    "p99_seconds": 51,
    "total_wall_clock_seconds": 1247
  },
  "token_cost_usd": 0.91,
  "cooldown_seconds": 1
}`,
      outcome: '50 leads enriched in 20m 47s. 38 leads upgraded tier. LinkedIn channel auto-disabled mid-batch and the operator was notified to refresh credentials. The 1 tier downgrade was a lead whose revenue figure was corrected downward by a more authoritative source.',
    },
    {
      scenario: 'Merge-not-overwrite preserves existing phone when enrichment does not find one.',
      input: `Lead l_9012 has an existing phone "+1-555-0100" (manually entered by operator). Enrichment run er_4f30 returns phone=null (LLM could not determine from research context).`,
      reasoning: `Merge step loads the existing lead: phone="+1-555-0100", email=null. Enrichment result for this lead: phone=null, email="ceo@acme.com". Apply merge-not-overwrite: phone — incoming is null, existing is non-null, preserve existing (no change). email — incoming is non-null, existing is null, write incoming. Persist the merged record. Write audit log entries: phone=preserved, email=written. Recompute data_completeness: was 35%, now 38% (one new field written).`,
      output: `{
  "lead_id": "l_9012",
  "enrichment_run_id": "er_4f30",
  "merge_audit": [
    { "field": "phone", "action": "preserved", "existing": "+1-555-0100", "incoming": null, "reason": "incoming_null" },
    { "field": "email", "action": "written", "existing": null, "incoming": "ceo@acme.com", "source_url": "https://acme.com/team", "confidence": 0.92 }
  ],
  "data_completeness_before": 35.0,
  "data_completeness_after": 38.3,
  "zero_data_loss": true
}`,
      outcome: 'Operator\'s manually entered phone number preserved. Email newly populated. Zero data loss confirmed by audit log. Operator trust in Forge increased after seeing the preservation in action.',
    },
  ],

  guardrails: [
    {
      rule: 'Never fabricate data — return null for fields that cannot be determined with confidence.',
      rationale: 'Fabricated data poisons downstream scoring, outreach personalization, and operator trust. Null is honest; fabrication is dangerous.',
      enforcement: 'System prompt explicitly forbids fabrication. Suspicious-value detector quarantines round numbers, repeated values, and generic strings. Quarantined values are not persisted.',
      severity: 'block',
    },
    {
      rule: 'Never overwrite a non-null existing field with a null incoming value.',
      rationale: 'The merge-not-overwrite rule is the bedrock of zero data loss. Existing user-curated data is sacred; enrichment can only add, not subtract.',
      enforcement: 'Field Merger tool compares incoming vs existing for every field; null incoming values are skipped by the merge function. The rule is enforced in code, not just policy.',
      severity: 'block',
    },
    {
      rule: 'Never persist a field without a source_url.',
      rationale: 'Source attribution is mandatory for verification and trust. Without a source URL, the operator cannot verify the value, and the verified_completeness scoring bonus cannot apply.',
      enforcement: 'Source URL Tracker tool requires a non-null source_url before persisting any enriched field. Fields without a source_url are flagged and not eligible for the verified_completeness bonus.',
      severity: 'block',
    },
    {
      rule: 'Never exceed the 50-lead batch cap or skip the 1-second cooldown.',
      rationale: 'Both limits exist to respect upstream API rate limits (z-ai web_search, page_reader, LinkedIn) and keep wall-clock time predictable. Exceeding them triggers 429s and channel disablement.',
      enforcement: 'Batch dispatcher enforces the cap and cooldown in code; violations are logged and the over-limit leads are queued for the next batch.',
      severity: 'block',
    },
    {
      rule: 'Never skip the suspicious-value detector on LLM-extracted fields.',
      rationale: 'Even with temperature 0.2 and JSON-schema enforcement, the LLM can hallucinate. The detector is the last line of defense against fabrication.',
      enforcement: 'The extraction pipeline calls the detector on every field post-extraction. A field flagged as suspicious is quarantined and not persisted; the run is flagged for prompt review.',
      severity: 'block',
    },
    {
      rule: 'Always recompute data_completeness after every merge.',
      rationale: 'The UI displays the live completeness value on each lead card; stale values mislead the operator and break batch prioritization.',
      enforcement: 'Merge step calls the completeness computer after the merge and persists the new value before returning. The Lead DB Persister requires a fresh completeness value.',
      severity: 'warn',
    },
    {
      rule: 'Always persist score_explanation alongside lead_score and lead_tier.',
      rationale: 'A score without an explanation is a black box. The operator must be able to understand why a lead was scored the way it was.',
      enforcement: 'Scoring step writes score_drivers and score_explanation to the Lead record in the same transaction as lead_score. DB constraint requires non-null score_explanation when lead_score is non-null.',
      severity: 'warn',
    },
    {
      rule: 'Always emit lead.enriched event when enrichment completes.',
      rationale: 'Downstream agents (Judge, Sage, Bard) subscribe to this event to trigger scoring refinement, deeper research, and outreach composition. Missing events stall the pipeline.',
      enforcement: 'Post-merge hook verifies the event was emitted; failures are retried. The orchestrator monitors for missing lead.enriched events within a 5-second window.',
      severity: 'block',
    },
  ],

  decisionMatrix: [
    {
      condition: 'LLM returns a value that the suspicious-value detector flags (round number, repeated value, generic string).',
      action: 'Quarantine the field; do not persist it. Log the quarantine for prompt review. Treat the field as null for the rest of the pipeline.',
      rationale: 'Fabricated-looking values erode trust and can poison downstream scoring. Quarantine is safer than persistence.',
      example: 'LLM returned annual_revenue=10000000 (round number, suspicious). Quarantined. Field left null. Lead flagged for re-enrichment; later run found $42M from a Crunchbase source.',
    },
    {
      condition: 'LinkedIn returns 401 Unauthorized during step 3.',
      action: 'Disable the LinkedIn channel for the remainder of the batch. Continue with LLM-extracted values for firmographic fields. Flag affected leads for LinkedIn re-enrichment when the channel recovers.',
      rationale: 'A 401 typically means token expiry; retrying within the batch is futile. Disabling prevents cascading 401s and preserves batch throughput.',
      example: 'Lead 2 in batch b_8842 hit 401. Channel disabled. Leads 2-50 used LLM-extracted employee_count (lower confidence). Operator refreshed credentials; lead 2 was re-enriched the next day.',
    },
    {
      condition: 'page_reader returns fewer than 1000 characters (JS-rendered site).',
      action: 'Retry once with the /about subpath. If still < 1000 chars, proceed with search-snippets-only extraction and subtract 0.2 from each field confidence.',
      rationale: 'JS-rendered sites yield sparse primary-source text; falling back to search snippets preserves the run while flagging lower confidence.',
      example: 'acme.com returned 412 chars (React SPA). Retry with /about returned 389 chars. Proceeded with search-snippet extraction; confidence reduced from 0.92 to 0.72 across all fields.',
    },
    {
      condition: 'Keyword matcher confidence for industry is below 0.6.',
      action: 'Invoke the LLM with a focused classification prompt using the research context. Cross-check the LLM classification against the keyword matcher; prefer the keyword matcher (deterministic) on divergence and log the divergence.',
      rationale: 'Low keyword confidence indicates an ambiguous industry name; the LLM has more context to disambiguate. The keyword matcher remains the source of truth to keep classification deterministic.',
      example: 'Keyword matcher returned industry="Software" with confidence 0.42 (ambiguous). LLM classified as "Developer Tools" (sub-industry). SIC/NAICS assigned from keyword matcher; sub_industry from LLM. Divergence logged.',
    },
    {
      condition: 'A field\'s captured_at timestamp is older than 90 days.',
      action: 'Queue the lead for re-enrichment on the next batch run, regardless of current completeness. Use force_refresh=true on the stale fields so the new value overrides the old.',
      rationale: 'Stale data erodes scoring accuracy. A company that was Series B 90 days ago may now be Series C; the score must reflect the current state.',
      example: 'Lead l_9012 had last_funding_amount captured 112 days ago. Queued for re-enrichment. Next batch found a Series C announcement from 30 days ago; funding updated to the new value.',
    },
    {
      condition: 'A field\'s source URL returns 4xx/5xx in the periodic dead-link check.',
      action: 'Re-enrich the affected field on the next batch run. Mark the field as low-confidence in the interim.',
      rationale: 'Dead source URLs undermine verifiability. Re-enrichment restores a live source URL.',
      example: 'Source URL https://blog.acme.com/funding-2024 returned 410 Gone. Field last_funding_amount flagged low-confidence. Re-enrichment found a Crunchbase source with the same value.',
    },
    {
      condition: 'Batch token cost exceeds the per-batch cap ($5 default).',
      action: 'Pause the batch at the current lead. Surface the over-budget event to the operator with the remaining leads count and the cost-so-far. Resume only on operator approval.',
      rationale: 'Unbounded token cost creates surprise invoices. The cap enforces a hard stop and operator visibility.',
      example: 'Batch b_8843 hit $5.12 after 41 leads. Paused. Operator approved $7 cap; batch resumed and completed 50 leads at $6.84.',
    },
    {
      condition: 'Two sources disagree on a field value (e.g. LinkedIn says 450 employees, LLM says 380).',
      action: 'Prefer the higher-authority source. Authority ranking: primary source (company website) > LinkedIn > Exa > z-ai web_search > Reddit. If same authority tier, prefer the more recent value.',
      rationale: 'Higher-authority sources are more reliable. Deterministic authority ranking prevents inconsistent choices across runs.',
      example: 'LinkedIn (450) vs LLM (380) for employee_count. LinkedIn wins (higher authority). Divergence logged. Lead persisted with 450 employees, source_url=LinkedIn.',
    },
  ],

  failureModes: [
    {
      failure: 'LLM returns malformed JSON despite response_format=json_schema.',
      detection: 'JSON validator rejects the response within 200ms.',
      mitigation: 'Retry once with a tighter prompt that re-emphasizes the required shape and forbids prose. On second failure, persist the partial extraction (whichever fields parsed) and flag the lead for re-enrichment.',
      recoveryTime: '< 10 seconds for the retry; partial persistence keeps the lead usable.',
    },
    {
      failure: 'LinkedIn OAuth token expires mid-batch (401 Unauthorized).',
      detection: 'LinkedIn API returns 401 on the next call.',
      mitigation: 'Disable the LinkedIn channel for the remainder of the batch. Continue with LLM-extracted values for firmographic fields. Notify the operator to refresh credentials. Flag affected leads for LinkedIn re-enrichment.',
      recoveryTime: '< 5 minutes after operator refreshes credentials; affected leads re-enriched on next batch.',
    },
    {
      failure: 'page_reader times out on a JS-rendered company website.',
      detection: 'page_reader returns < 1000 characters or times out at 12s.',
      mitigation: 'Retry once with the /about subpath. If still low-content, proceed with search-snippets-only extraction and reduce field confidence by 0.2. Flag the lead for re-enrichment with a headless-browser fallback if available.',
      recoveryTime: 'No user-visible delay; lower-confidence extraction proceeds inline.',
    },
    {
      failure: 'Postgres write fails during Lead persistence.',
      detection: 'DB write returns error within 5s.',
      mitigation: '3 retries with 200ms exponential backoff. If still failing, queue the merge result in-memory and surface to the operator. The in-memory result is replayed on the next batch run.',
      recoveryTime: '< 60 seconds after Postgres recovery; in-memory queue flushed.',
    },
    {
      failure: 'Industry classification returns no match from both keyword matcher and LLM.',
      detection: 'Both matcher and LLM return null industry.',
      mitigation: 'Leave sic_code, naics_code, sub_industry null. Flag the lead for manual industry tagging. Lead still receives a score (firmographic dimension defaults to 0 for industry match).',
      recoveryTime: 'Immediate (lead is persisted with nulls); manual tagging by operator typically within 24 hours.',
    },
    {
      failure: 'Suspicious-value detector flags > 5% of fields in a single run.',
      detection: 'Post-extraction detector reports fabrication rate > 5%.',
      mitigation: 'Quarantine all flagged fields. Pause the batch. Trigger a prompt review by the agent operations team. Resume the batch only after the prompt is patched.',
      recoveryTime: '< 1 hour for prompt review; batch resumes from the paused lead.',
    },
    {
      failure: 'Source URL dead-link check finds > 10% dead links for a campaign.',
      detection: 'Periodic link-check job reports > 10% 4xx/5xx source URLs.',
      mitigation: 'Queue affected fields for re-enrichment on the next batch run. Mark affected fields as low-confidence in the interim. Notify the operator.',
      recoveryTime: '< 24 hours for the next batch run to re-enrich affected fields.',
    },
  ],

  evaluationCases: [
    {
      id: 'eval_forge_001',
      input: 'Enrich lead l_8842 with name "Acme Corp" and website "https://acme.com". Existing data_completeness: 8%.',
      expectedOutput: 'Full 5-step pipeline runs. 40+ fields filled. data_completeness rises above 60%. lead_score computed. lead_tier assigned. lead.enriched event emitted.',
      scoringCriteria: [
        'Pipeline runs all 5 steps in order.',
        'At least 40 fields populated (of 60+ schema fields).',
        'data_completeness_after > 60%.',
        'lead_score is a number 0-100.',
        'lead_tier is one of cold / warm / hot / super_hot.',
        'Every enriched field has a non-null source_url.',
        'lead.enriched event emitted within 5s of merge completion.',
      ],
      passThreshold: 6,
    },
    {
      id: 'eval_forge_002',
      input: 'Enrich a lead whose existing phone field is "+1-555-0100". Enrichment result has phone=null.',
      expectedOutput: 'Existing phone preserved. Merge audit logs phone=preserved. data_completeness unchanged for phone. Zero data loss confirmed.',
      scoringCriteria: [
        'Existing phone value preserved (not overwritten with null).',
        'Merge audit log entry for phone has action=preserved.',
        'No other non-null existing field is overwritten by null.',
        'data_completeness recomputed and persisted.',
      ],
      passThreshold: 4,
    },
    {
      id: 'eval_forge_003',
      input: 'Batch enrich 50 leads for campaign c_412 with 1-second cooldown.',
      expectedOutput: 'All 50 leads processed. 1-second cooldown enforced between leads. Batch summary emitted with leads_processed=50, tier_upgrades, total_fields_filled, total_cost, latency p50/p99.',
      scoringCriteria: [
        'Exactly 50 leads processed (or fewer if campaign has < 50).',
        'Cooldown of at least 1 second between leads (verified via timestamps).',
        'Batch summary includes leads_processed, tier_upgrades, total_fields_filled, total_cost, latency.',
        'Per-lead failures do not abort the batch.',
        'lead.enriched event emitted for each successfully enriched lead.',
      ],
      passThreshold: 5,
    },
    {
      id: 'eval_forge_004',
      input: 'LLM returns a suspicious value: annual_revenue=10000000 (round number, no source).',
      expectedOutput: 'Suspicious-value detector quarantines the field. Field not persisted. Run flagged for prompt review if rate exceeds 1%.',
      scoringCriteria: [
        'Suspicious-value detector flags the round number.',
        'Field is not persisted (treated as null).',
        'Quarantine logged for prompt review.',
        'Other (non-suspicious) fields in the same run are persisted normally.',
      ],
      passThreshold: 4,
    },
    {
      id: 'eval_forge_005',
      input: 'Lead l_9012 has fields captured 112 days ago. Re-enrichment triggered with stale threshold 90 days.',
      expectedOutput: 'Stale fields identified and queued for re-enrichment. force_refresh=true applied. New values override old where source authority is equal or higher.',
      scoringCriteria: [
        'Fields older than 90 days identified.',
        'Re-enrichment uses force_refresh=true for stale fields.',
        'New values override old values (not blocked by merge-not-overwrite).',
        'Old vs new values and timestamps logged for audit.',
        'lead_score recomputed after re-enrichment.',
      ],
      passThreshold: 5,
    },
  ],
};
