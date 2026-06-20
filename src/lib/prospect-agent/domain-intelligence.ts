// ============================================================
// LeadReach — Domain Intelligence Engine
// ============================================================
// Institutional-grade domain-specific research pipeline.
// When a query enters a specialized domain (VC, PE, hedge funds,
// real estate, government contracting, etc.), this engine triggers
// a deterministic 4-phase pipeline that transforms a search query
// into an optimized, production-ready response.
// ============================================================

/**
 * Phase 1: Intent Mapping & Contextual Expansion
 *
 * The system dynamically expands high-level prompts into explicit
 * data requirements. For instance, if a user queries a region or
 * a sector, the system automatically appends strict schema constraints.
 *
 * Query Intent = [Target Entity/Region] + [Regulatory Body] + [Fund Class] + [KPI Matrices]
 */

export interface DomainSchema {
  domain: DomainType;
  label: string;
  description: string;
  triggerKeywords: string[];
  triggerPhrases: string[];
  regulatoryBodies: string[];
  entityTypes: string[];
  requiredKPIs: string[];
  optionalKPIs: string[];
  contactStages: string[];
  legalEntityFormats: Record<string, string>;
  financialConstraints: FinancialConstraint[];
  defaultSearchQueries: (input: string) => string[];
  schemaTemplate: Record<string, unknown>;
}

export type DomainType =
  | 'venture_capital'
  | 'private_equity'
  | 'hedge_funds'
  | 'real_estate'
  | 'government_contracting'
  | 'investment_banking'
  | 'insurance'
  | 'pharma_biotech'
  | 'technology_saaS'
  | 'manufacturing'
  | 'energy_utilities'
  | 'financial_services'
  | 'healthcare'
  | 'education'
  | 'general';

export interface FinancialConstraint {
  name: string;
  rule: string;
  description: string;
  example: string;
}

// ============================================================
// Domain Schemas — Complete definitions for each domain
// ============================================================

export const DOMAIN_SCHEMAS: Record<DomainType, DomainSchema> = {
  venture_capital: {
    domain: 'venture_capital',
    label: 'Venture Capital & Limited Partners',
    description: 'VC firms, their funds, LP compositions, dry powder, portfolio companies, and stage-specific contact matrices.',
    triggerKeywords: [
      'vc', 'venture capital', 'venture firm', 'fund', 'dry powder', 'limited partner', 'lp',
      'fundraising', 'fund size', 'vintage year', 'tvpi', 'dpi', 'irr', 'carry', 'hurdle rate',
      'general partner', 'gp', 'commitment', 'allocation', 'portfolio company', 'fund closing',
      'capital call', 'distribution', 'j-curve', 'preferred return', 'catch-up', 'waterfall',
      'carry interest', 'management fee', 'fund admin', 'placement agent', 'fund of funds',
      'sovereign wealth', 'endowment', 'family office', 'pension', 'anchor investor',
      'seed fund', 'growth equity', 'late stage', 'pre-seed', 'series a', 'series b', 'series c',
      'angel investor', 'super angel', 'micro vc', 'cvc', 'corporate venture',
    ],
    triggerPhrases: [
      'vc firms with limited partners',
      'venture capital funds',
      'find vc firms',
      'lp composition',
      'dry powder remaining',
      'fund vintage',
      'capital deployment',
      'investment committee',
      'deal flow',
      'portfolio construction',
      'fund performance',
      'lp commitments',
      'who are the limited partners',
      'institutional investors in vc',
      'family offices investing in vc',
      'college endowments in venture',
      'pension funds in venture capital',
      'fund managers',
      'managing directors at vc firms',
      'partners at venture firms',
    ],
    regulatoryBodies: ['SEC (Form ADV/Filings)', 'FCA (UK)', 'BaFin (Germany)', 'MAS (Singapore)', 'ASIC (Australia)', 'AMF (France)', 'FSS (Japan)', 'CVCA (Canada)'],
    entityTypes: [
      'VC Firm', 'VC Fund / Vehicle', 'Limited Partner (LP)', 'General Partner (GP)',
      'Fund of Funds', 'Placement Agent', 'Portfolio Company', 'Co-Investment Vehicle',
    ],
    requiredKPIs: [
      'vc_firm_name', 'fund_name', 'associated_llc', 'fund_type', 'estimated_dry_powder_usd',
      'vintage_year', 'geographic_focus', 'registered_jurisdiction', 'capital_disbursement_hub',
      'target_deployment_countries', 'limited_partners', 'kpis',
    ],
    optionalKPIs: [
      'strategy_overview', 'sector_focus', 'stage_preference', 'average_ticket_size_usd',
      'target_irr_percentage', 'historical_tvpi', 'historical_dpi', 'moic',
      'active_portfolio_companies_count', 'exits_count', 'unicorns_count',
      'fund_duration_years', 'extension_options', 'recycling_provision',
      'management_fee_percentage', 'carried_interest_percentage', 'hurdle_rate',
      'gp_commitment_percentage', 'side_letter_provisions', 'esg_policy',
      'diversity_inclusion_initiatives', 'impact_measurement_framework',
    ],
    contactStages: [
      'initial_scouting', 'due_diligence', 'investment_committee_approval', 'post_investment_support',
    ],
    legalEntityFormats: {
      'US': 'Delaware LLC / Delaware L.P.',
      'UK': 'LLP / Ltd.',
      'Germany': 'GmbH & Co. KG',
      'Singapore': 'Pte. Ltd.',
      'France': 'SAS / SLP',
      'Israel': 'Ltd. / Delaware feeder',
      'Japan': 'GK / TK',
      'Australia': 'Pty Ltd.',
      'Canada': 'L.P. / Inc.',
    },
    financialConstraints: [
      { name: 'TVPI >= DPI', rule: 'Total Value to Paid-In must be >= Distributed to Paid-In', description: 'TVPI includes both realized and unrealized value; DPI only realized. TVPI cannot be less than DPI.', example: 'TVPI 2.45x >= DPI 1.12x ✓' },
      { name: 'Fund Size >= LP Commitments', rule: 'Total fund size pool must be >= sum of allocated LP commitments', description: 'The aggregate capital available cannot be less than what LPs have committed.', example: 'Fund $750M >= Sum of LP commits $680M ✓' },
      { name: 'IRR Bounded', rule: 'Target IRR must be between 15% and 45%', description: 'Institutional VC target returns typically range from top-quartile 25-35% to aggressive 40%+.', example: 'Target IRR 27.5% ✓' },
      { name: 'Dry Powder <= Fund Size', rule: 'Remaining dry powder cannot exceed total fund size', description: 'Unallocated capital is a subset of the total fund, not additional.', example: 'Dry Powder $400M <= Fund Size $750M ✓' },
    ],
    defaultSearchQueries: (input: string) => [
      `"${input}" venture capital fund limited partners LPs`,
      `"${input}" fund size dry powder vintage year`,
      `"${input}" SEC Form ADV filing registered investment adviser`,
      `"${input}" portfolio companies investments exits`,
      `"${input}" general partner managing director contact`,
      `"${input}" LP commitments allocation pension endowment family office`,
      `"${input}" TVPI DPI IRR fund performance`,
      `"${input}" investment thesis sector focus stage preference`,
    ],
    schemaTemplate: {
      vc_firm_name: '', fund_name: '', associated_llc: '', fund_type: '',
      estimated_dry_powder_usd: 0, vintage_year: 0, geographic_focus: '',
      registered_jurisdiction: '', capital_disbursement_hub: '',
      target_deployment_countries: [], limited_partners: [{
        lp_name: '', lp_category: '', lp_profession: '', lp_investment_interest: '',
        estimated_allocation_usd: 0, historical_relationship_years: 0,
      }],
      kpis: { target_irr_percentage: 0, historical_tvpi: 0, historical_dpi: 0, average_ticket_size_usd: 0, active_portfolio_companies_count: 0 },
      stages_contact_matrix: {
        initial_scouting: { key_contact_person: '', title: '', email: '', phone_number: '', preferred_channel: '' },
        due_diligence: { key_contact_person: '', title: '', email: '', phone_number: '', preferred_channel: '' },
        investment_committee_approval: { key_contact_person: '', title: '', email: '', phone_number: '', preferred_channel: '' },
        post_investment_support: { key_contact_person: '', title: '', email: '', phone_number: '', preferred_channel: '' },
      },
    },
  },

  private_equity: {
    domain: 'private_equity',
    label: 'Private Equity & Buyout Funds',
    description: 'PE firms, buyout funds, portfolio companies, value creation plans, and operational improvement teams.',
    triggerKeywords: [
      'private equity', 'pe firm', 'buyout', 'leveraged buyout', 'lbo', 'growth equity',
      'take-private', 'carve-out', 'add-on acquisition', 'platform investment', 'bolt-on',
      'management buyout', 'mbo', 'recapitalization', 'distressed', 'turnaround',
      'value creation', 'operational improvement', 'ebitda', 'multiple expansion',
      'leverage ratio', 'debt financing', 'senior debt', 'mezzanine', 'unitranche',
      'sponsor', 'financial sponsor', 'deal team', 'operating partner',
    ],
    triggerPhrases: [
      'private equity firms', 'pe funds with', 'buyout targets', 'lbo candidates',
      'growth equity firms', 'pe portfolio companies', 'operating partners at',
      'value creation strategy', 'ebitda multiple', 'leverage ratio',
    ],
    regulatoryBodies: ['SEC (Form ADV/PF)', 'FCA (UK)', 'BaFin (Germany)', 'AMF (France)', 'MAS (Singapore)'],
    entityTypes: ['PE Firm', 'Buyout Fund', 'Portfolio Company', 'Operating Partner', 'Deal Team', 'LP Investor'],
    requiredKPIs: ['pe_firm_name', 'fund_name', 'fund_type', 'fund_size_usd', 'vintage_year', 'geographic_focus', 'sector_focus', 'limited_partners', 'kpis'],
    optionalKPIs: ['ev_ebitda_multiple', 'leverage_ratio', 'ebitda_margin_target', 'value_creation_plan', 'holding_period_target', 'irr_target', 'moic_target'],
    contactStages: ['deal_sourcing', 'due_diligence', 'investment_committee', 'portfolio_management', 'exit_planning'],
    legalEntityFormats: { 'US': 'Delaware L.P.', 'UK': 'LLP', 'Germany': 'GmbH & Co. KG', 'France': 'SLP' },
    financialConstraints: [
      { name: 'EV/EBITDA Bounded', rule: 'Entry multiple typically 6-15x for buyouts', description: 'LBO entry multiples are bounded by leverage capacity and return targets.', example: 'Entry 8.5x EBITDA ✓' },
      { name: 'Leverage <= 6x EBITDA', rule: 'Total leverage typically capped at 5-6x EBITDA', description: 'Senior + subordinated debt cannot exceed sustainable leverage.', example: '4.5x leverage ✓' },
    ],
    defaultSearchQueries: (input: string) => [
      `"${input}" private equity fund buyout LPs`,
      `"${input}" fund size vintage year sector focus`,
      `"${input}" portfolio companies exits returns`,
      `"${input}" operating partner deal team contact`,
      `"${input}" SEC Form ADV filing`,
      `"${input}" EBITDA multiple leverage ratio`,
    ],
    schemaTemplate: {
      pe_firm_name: '', fund_name: '', fund_type: '', fund_size_usd: 0, vintage_year: 0,
      geographic_focus: '', sector_focus: '', limited_partners: [], kpis: {},
      stages_contact_matrix: {},
    },
  },

  hedge_funds: {
    domain: 'hedge_funds',
    label: 'Hedge Funds & Alternative Investment',
    description: 'Hedge fund managers, strategies, AUM, performance, and prime brokerage relationships.',
    triggerKeywords: ['hedge fund', 'quant fund', 'long-short', 'activist', 'macro fund', 'cta', 'managed futures', 'alpha', 'sharpe ratio', 'aum', 'prime broker', 'fund administrator'],
    triggerPhrases: ['hedge fund managers', 'fund performance', 'aum breakdown', 'strategy allocation', 'prime brokerage'],
    regulatoryBodies: ['SEC (Form ADV/PF)', 'FCA (UK)', 'CFTC', 'NFA', 'MAS (Singapore)', 'SFC (Hong Kong)'],
    entityTypes: ['Hedge Fund', 'Fund Manager', 'Prime Broker', 'Fund Administrator', 'LP/Investor'],
    requiredKPIs: ['fund_name', 'manager_name', 'strategy', 'aum_usd', 'inception_date', 'jurisdiction'],
    optionalKPIs: ['sharpe_ratio', 'sortino_ratio', 'max_drawdown', 'alpha', 'beta', 'correlation', 'fee_structure'],
    contactStages: ['initial_inquiry', 'due_diligence', 'allocation_decision', 'ongoing_monitoring'],
    legalEntityFormats: { 'US': 'Delaware L.P.', 'UK': 'Ltd.', 'Cayman': 'Exempted L.P.' },
    financialConstraints: [
      { name: 'AUM Positive', rule: 'AUM must be > 0', description: 'Assets under management are always positive.', example: 'AUM $2.4B ✓' },
    ],
    defaultSearchQueries: (input: string) => [
      `"${input}" hedge fund strategy AUM performance`,
      `"${input}" SEC Form ADV filing`,
      `"${input}" prime broker administrator`,
      `"${input}" fund manager portfolio allocation`,
    ],
    schemaTemplate: { fund_name: '', manager_name: '', strategy: '', aum_usd: 0, inception_date: '', jurisdiction: '', kpis: {}, stages_contact_matrix: {} },
  },

  real_estate: {
    domain: 'real_estate',
    label: 'Real Estate & Property Investment',
    description: 'REITs, property funds, development projects, and commercial real estate investments.',
    triggerKeywords: ['reit', 'real estate', 'property fund', 'commercial real estate', 'cre', 'development', 'cap rate', 'noi', 'occupancy', 'rental yield', 'property management'],
    triggerPhrases: ['real estate funds', 'property investors', 'reit performance', 'cap rates', 'development pipeline'],
    regulatoryBodies: ['SEC', 'FCA', 'BaFin', 'MAS'],
    entityTypes: ['REIT', 'Property Fund', 'Developer', 'Property Manager', 'LP Investor'],
    requiredKPIs: ['entity_name', 'entity_type', 'aum_usd', 'property_type', 'geographic_focus', 'cap_rate'],
    optionalKPIs: ['noi', 'occupancy_rate', 'rental_yield', 'debt_ratio', 'development_pipeline'],
    contactStages: ['deal_sourcing', 'underwriting', 'investment_committee', 'asset_management', 'disposition'],
    legalEntityFormats: { 'US': 'REIT / Delaware L.P.', 'UK': 'REIT / Ltd.', 'Germany': 'GmbH & Co. KG' },
    financialConstraints: [
      { name: 'Cap Rate Bounded', rule: 'Cap rate typically 3-12% depending on asset class', description: 'Cap rates reflect risk premium over risk-free rate.', example: 'Cap rate 5.2% ✓' },
    ],
    defaultSearchQueries: (input: string) => [
      `"${input}" real estate fund REIT property`,
      `"${input}" cap rate NOI occupancy`,
      `"${input}" development pipeline AUM`,
      `"${input}" SEC filing annual report`,
    ],
    schemaTemplate: { entity_name: '', entity_type: '', aum_usd: 0, property_type: '', geographic_focus: '', cap_rate: 0, kpis: {}, stages_contact_matrix: {} },
  },

  government_contracting: {
    domain: 'government_contracting',
    label: 'Government Contracting & Public Sector',
    description: 'Government contractors, federal spending, procurement, and public sector vendors.',
    triggerKeywords: ['government contract', 'federal contractor', 'procurement', 'rfp', 'rfq', 'sbir', '8a', 'gsa schedule', 'dod', 'defense contractor', 'public sector', 'government spending', 'sam.gov', 'fpds', 'usaspending'],
    triggerPhrases: ['government contractors in', 'federal spending on', 'defense contracts', 'procurement opportunities', 'public sector vendors'],
    regulatoryBodies: ['GSA', 'DOD', 'DHS', 'VA', 'DOE', 'SBA', 'GAO', 'OFPP'],
    entityTypes: ['Prime Contractor', 'Subcontractor', 'Joint Venture', 'Mentor-Protégé', 'Agency'],
    requiredKPIs: ['contractor_name', 'contract_type', 'agency', 'contract_value_usd', 'naics_code', 'set_aside_type'],
    optionalKPIs: ['contract_duration', 'option_years', 'past_performance_rating', 'small_business_status', 'socioeconomic_status'],
    contactStages: ['opportunity_identification', 'proposal_development', 'award_negotiation', 'contract_administration', 'closeout'],
    legalEntityFormats: { 'US': 'Inc. / LLC / Corp.', 'UK': 'Ltd. / PLC' },
    financialConstraints: [],
    defaultSearchQueries: (input: string) => [
      `"${input}" government contract federal spending`,
      `"${input}" SAM.gov registration contractor`,
      `"${input}" DOD defense procurement`,
      `"${input}" NAICS code set-aside`,
    ],
    schemaTemplate: { contractor_name: '', contract_type: '', agency: '', contract_value_usd: 0, naics_code: '', set_aside_type: '', kpis: {}, stages_contact_matrix: {} },
  },

  investment_banking: {
    domain: 'investment_banking',
    label: 'Investment Banking & Capital Markets',
    description: 'Investment banks, deal activity, league tables, and capital markets teams.',
    triggerKeywords: ['investment bank', 'bulge bracket', 'middle market', 'boutique bank', 'm&a advisor', 'capital markets', 'ipo', 'leveraged finance', 'restructuring', 'league table'],
    triggerPhrases: ['investment banking firms', 'm&a advisors', 'ipo underwriters', 'league tables', 'deal activity'],
    regulatoryBodies: ['SEC', 'FINRA', 'FCA', 'MAS', 'ASIC'],
    entityTypes: ['Investment Bank', 'M&A Advisor', 'Underwriter', 'Boutique Advisory', 'Industry Team'],
    requiredKPIs: ['firm_name', 'division', 'sector_coverage', 'deal_volume', 'league_table_rank'],
    optionalKPIs: ['avg_deal_size', 'completed_deals', 'revenue_estimate', 'headcount', 'office_locations'],
    contactStages: ['pitch', 'engagement', 'execution', 'closing'],
    legalEntityFormats: { 'US': 'Inc. / LLC', 'UK': 'Ltd.' },
    financialConstraints: [],
    defaultSearchQueries: (input: string) => [
      `"${input}" investment bank M&A advisory`,
      `"${input}" league table deal volume`,
      `"${input}" sector coverage team managing director`,
      `"${input}" SEC FINRA registration`,
    ],
    schemaTemplate: { firm_name: '', division: '', sector_coverage: '', deal_volume: 0, league_table_rank: 0, kpis: {}, stages_contact_matrix: {} },
  },

  insurance: {
    domain: 'insurance',
    label: 'Insurance & Reinsurance',
    description: 'Insurance carriers, reinsurers, brokers, and underwriting firms.',
    triggerKeywords: ['insurance', 'reinsurance', 'underwriting', 'broker', 'carrier', 'premium', 'loss ratio', 'combined ratio', 'actuarial', 'policy', 'claims'],
    triggerPhrases: ['insurance companies', 'reinsurance market', 'underwriting firms', 'insurance brokers', 'premium volume'],
    regulatoryBodies: ['NAIC', 'FCA', 'EIOPA', 'MAS', 'APRA'],
    entityTypes: ['Carrier', 'Reinsurer', 'Broker', 'MGU/MGA', 'Captive'],
    requiredKPIs: ['firm_name', 'firm_type', 'premium_volume_usd', 'lines_of_business', 'combined_ratio'],
    optionalKPIs: ['loss_ratio', 'expense_ratio', 'policy_count', 'aum', 'am_best_rating'],
    contactStages: ['submission', 'underwriting', 'binding', 'claims', 'renewal'],
    legalEntityFormats: { 'US': 'Inc. / Mutual', 'UK': 'Ltd. / LLP', 'Bermuda': 'Ltd.' },
    financialConstraints: [
      { name: 'Combined Ratio Bounded', rule: 'Combined ratio typically 85-110%', description: 'Below 100% = underwriting profit; above = loss.', example: 'Combined ratio 97.2% ✓' },
    ],
    defaultSearchQueries: (input: string) => [
      `"${input}" insurance carrier reinsurance premium`,
      `"${input}" combined ratio AM Best rating`,
      `"${input}" underwriting claims lines of business`,
      `"${input}" SEC annual report statutory filing`,
    ],
    schemaTemplate: { firm_name: '', firm_type: '', premium_volume_usd: 0, lines_of_business: [], combined_ratio: 0, kpis: {}, stages_contact_matrix: {} },
  },

  pharma_biotech: {
    domain: 'pharma_biotech',
    label: 'Pharmaceutical & Biotech',
    description: 'Pharma companies, biotech firms, clinical trials, drug pipelines, and regulatory approvals.',
    triggerKeywords: ['pharma', 'biotech', 'clinical trial', 'drug pipeline', 'fda', 'ema', 'nda', 'bla', 'phase 1', 'phase 2', 'phase 3', 'orphan drug', 'patent cliff', 'blockbuster drug', 'cdmo', 'cro'],
    triggerPhrases: ['pharmaceutical companies', 'biotech startups', 'clinical trials', 'drug pipeline', 'fda approvals', 'cdmo cro'],
    regulatoryBodies: ['FDA', 'EMA', 'PMDA', 'NMPA', 'MHRA', 'Health Canada', 'TGA'],
    entityTypes: ['Pharma Company', 'Biotech Firm', 'CDMO', 'CRO', 'Regulatory Consultant'],
    requiredKPIs: ['company_name', 'company_type', 'pipeline_stage', 'therapeutic_area', 'market_cap_usd'],
    optionalKPIs: ['rd_spend_usd', 'patent_expirations', 'fda_approvals', 'clinical_trial_count', 'partnerships'],
    contactStages: ['bd_licensing', 'clinical_collaboration', 'commercial_partnership', 'regulatory_strategy'],
    legalEntityFormats: { 'US': 'Inc. / Corp.', 'UK': 'Ltd.', 'Switzerland': 'AG', 'Ireland': 'Designated Activity Company' },
    financialConstraints: [],
    defaultSearchQueries: (input: string) => [
      `"${input}" pharma biotech clinical trial pipeline`,
      `"${input}" FDA approval drug development`,
      `"${input}" therapeutic area market cap R&D`,
      `"${input}" partnership licensing deal`,
    ],
    schemaTemplate: { company_name: '', company_type: '', pipeline_stage: '', therapeutic_area: '', market_cap_usd: 0, kpis: {}, stages_contact_matrix: {} },
  },

  technology_saaS: {
    domain: 'technology_saaS',
    label: 'Technology & SaaS',
    description: 'SaaS companies, cloud infrastructure, enterprise software, and technology startups.',
    triggerKeywords: ['saas', 'cloud', 'enterprise software', 'startup', 'arr', 'mrr', 'churn', 'cac', 'ltv', 'nrr', 'net retention', 'platform', 'api', 'devtools', 'infrastructure', 'ai/ml', 'cybersecurity'],
    triggerPhrases: ['saas companies', 'cloud infrastructure', 'enterprise software vendors', 'tech startups', 'arr mrr growth'],
    regulatoryBodies: ['SEC', 'FCA', 'GDPR Authorities', 'SOC 2', 'ISO'],
    entityTypes: ['SaaS Company', 'Platform', 'Infrastructure Provider', 'Developer Tool', 'Cybersecurity Firm'],
    requiredKPIs: ['company_name', 'product_name', 'arr_estimate', 'growth_rate', 'category', 'tech_stack'],
    optionalKPIs: ['nrr', 'gross_margin', 'ltv_cac_ratio', 'burn_rate', 'runway_months', 'funding_total'],
    contactStages: ['evaluation', 'poc', 'procurement', 'implementation', 'renewal'],
    legalEntityFormats: { 'US': 'Inc. / Delaware C-Corp', 'UK': 'Ltd.', 'Singapore': 'Pte. Ltd.' },
    financialConstraints: [
      { name: 'Gross Margin Bounded', rule: 'SaaS gross margin typically 60-85%', description: 'Healthy SaaS companies maintain high gross margins.', example: 'Gross margin 78% ✓' },
    ],
    defaultSearchQueries: (input: string) => [
      `"${input}" SaaS company ARR growth revenue`,
      `"${input}" enterprise software product features`,
      `"${input}" tech stack funding valuation`,
      `"${input}" CEO CTO VP Engineering contact`,
    ],
    schemaTemplate: { company_name: '', product_name: '', arr_estimate: 0, growth_rate: 0, category: '', tech_stack: [], kpis: {}, stages_contact_matrix: {} },
  },

  manufacturing: {
    domain: 'manufacturing',
    label: 'Manufacturing & Industrial',
    description: 'Manufacturers, industrial companies, supply chain, and production facilities.',
    triggerKeywords: ['manufacturing', 'industrial', 'factory', 'production', 'supply chain', 'oem', 'contract manufacturer', 'precision', 'machining', 'assembly', 'logistics', 'procurement'],
    triggerPhrases: ['manufacturing companies', 'industrial firms', 'supply chain vendors', 'contract manufacturers', 'oem suppliers'],
    regulatoryBodies: ['OSHA', 'EPA', 'ISO', 'FDA (medical devices)', 'CE Marking'],
    entityTypes: ['OEM', 'Contract Manufacturer', 'Supplier', 'Distributor', 'Facility'],
    requiredKPIs: ['company_name', 'manufacturing_type', 'revenue_usd', 'employee_count', 'facility_locations'],
    optionalKPIs: ['certifications', 'production_capacity', 'lead_time', 'moq', 'export_markets'],
    contactStages: ['rfq', 'qualification', 'sampling', 'production', 'quality_assurance'],
    legalEntityFormats: { 'US': 'Inc. / LLC', 'Germany': 'GmbH', 'China': 'Co. Ltd.', 'Japan': 'K.K.' },
    financialConstraints: [],
    defaultSearchQueries: (input: string) => [
      `"${input}" manufacturing company production facility`,
      `"${input}" OEM contract manufacturer supplier`,
      `"${input}" certifications ISO quality capacity`,
      `"${input}" procurement supply chain contact`,
    ],
    schemaTemplate: { company_name: '', manufacturing_type: '', revenue_usd: 0, employee_count: 0, facility_locations: [], kpis: {}, stages_contact_matrix: {} },
  },

  energy_utilities: {
    domain: 'energy_utilities',
    label: 'Energy & Utilities',
    description: 'Energy companies, utilities, renewable energy, oil & gas, and power generation.',
    triggerKeywords: ['energy', 'utilities', 'renewable', 'solar', 'wind', 'oil gas', 'power generation', 'ppc', 'ppa', 'ev', 'grid', 'battery storage', 'esg', 'carbon', 'net zero'],
    triggerPhrases: ['energy companies', 'renewable energy', 'utility companies', 'power generation', 'oil gas firms'],
    regulatoryBodies: ['FERC', 'DOE', 'EPA', 'NRC', 'SEC', 'IEA', 'EU Commission'],
    entityTypes: ['Utility', 'IPP', 'Developer', 'O&G Company', 'Service Company', 'ESPC'],
    requiredKPIs: ['company_name', 'energy_type', 'capacity_mw', 'revenue_usd', 'geographic_footprint'],
    optionalKPIs: ['generation_mix', 'carbon_intensity', 'esg_rating', 'capex_plan', 'ppp_portfolio'],
    contactStages: ['prospecting', 'technical_review', 'commercial_negotiation', 'ppa_execution', 'operations'],
    legalEntityFormats: { 'US': 'Inc. / LLC', 'UK': 'Ltd. / PLC', 'Germany': 'AG / GmbH' },
    financialConstraints: [],
    defaultSearchQueries: (input: string) => [
      `"${input}" energy utility company capacity MW`,
      `"${input}" renewable generation portfolio`,
      `"${input}" PPA power purchase agreement`,
      `"${input}" ESG carbon net zero target`,
    ],
    schemaTemplate: { company_name: '', energy_type: '', capacity_mw: 0, revenue_usd: 0, geographic_footprint: '', kpis: {}, stages_contact_matrix: {} },
  },

  financial_services: {
    domain: 'financial_services',
    label: 'Financial Services & FinTech',
    description: 'Banks, fintech companies, payment processors, lending platforms, and financial infrastructure.',
    triggerKeywords: ['fintech', 'banking', 'payments', 'lending', 'neobank', 'defi', 'blockchain', 'crypto', 'wealth management', 'robo-advisor', 'regtech', 'insurtech', 'remittance', 'bnpl'],
    triggerPhrases: ['fintech companies', 'banking platform', 'payment processor', 'lending platform', 'financial infrastructure'],
    regulatoryBodies: ['SEC', 'OCC', 'FDIC', 'CFPB', 'FCA', 'MAS', 'FINRA'],
    entityTypes: ['Bank', 'FinTech', 'Payment Processor', 'Lender', 'Wealth Manager', 'RegTech'],
    requiredKPIs: ['company_name', 'category', 'tpv_usd', 'aum_usd', 'licenses', 'geographic_coverage'],
    optionalKPIs: ['transaction_volume', 'user_count', 'nps', 'compliance_certifications', 'api_availability'],
    contactStages: ['partnership_inquiry', 'integration_review', 'compliance_check', 'commercial_terms', 'go_live'],
    legalEntityFormats: { 'US': 'Inc. / N.A. / FSB', 'UK': 'Ltd.', 'EU': 'S.A.' },
    financialConstraints: [],
    defaultSearchQueries: (input: string) => [
      `"${input}" fintech financial services platform`,
      `"${input}" banking payment processing license`,
      `"${input}" compliance regulation SEC OCC`,
      `"${input}" partnership integration API`,
    ],
    schemaTemplate: { company_name: '', category: '', tpv_usd: 0, aum_usd: 0, licenses: [], geographic_coverage: '', kpis: {}, stages_contact_matrix: {} },
  },

  healthcare: {
    domain: 'healthcare',
    label: 'Healthcare & Medical Devices',
    description: 'Healthcare providers, medical device companies, health systems, and digital health platforms.',
    triggerKeywords: ['healthcare', 'hospital', 'health system', 'medical device', 'digital health', 'telemedicine', 'ehr', 'hipaa', 'clinical', 'patient', 'payer', 'provider', 'medtech'],
    triggerPhrases: ['healthcare companies', 'medical device firms', 'health systems', 'digital health platforms', 'medtech startups'],
    regulatoryBodies: ['FDA', 'CMS', 'HIPAA', 'EMA', 'MHRA', 'TGA'],
    entityTypes: ['Health System', 'Medical Device Company', 'Digital Health Platform', 'Payer', 'Provider Group'],
    requiredKPIs: ['company_name', 'category', 'revenue_usd', 'patient_volume', 'geographic_coverage'],
    optionalKPIs: ['bed_count', 'specialties', 'ehr_system', 'hipaa_compliance', 'quality_ratings'],
    contactStages: ['evaluation', 'clinical_review', 'procurement', 'implementation', 'outcomes_measurement'],
    legalEntityFormats: { 'US': 'Inc. / LLC / Non-profit', 'UK': 'NHS Trust / Ltd.' },
    financialConstraints: [],
    defaultSearchQueries: (input: string) => [
      `"${input}" healthcare medical device company`,
      `"${input}" hospital health system revenue`,
      `"${input}" digital health telemedicine platform`,
      `"${input}" FDA approval HIPAA compliance`,
    ],
    schemaTemplate: { company_name: '', category: '', revenue_usd: 0, patient_volume: 0, geographic_coverage: '', kpis: {}, stages_contact_matrix: {} },
  },

  education: {
    domain: 'education',
    label: 'Education & EdTech',
    description: 'Educational institutions, edtech platforms, training companies, and educational publishers.',
    triggerKeywords: ['education', 'edtech', 'university', 'college', 'school', 'learning', 'lms', 'training', 'certification', 'curriculum', 'tutoring', 'mooc'],
    triggerPhrases: ['edtech companies', 'educational institutions', 'learning platforms', 'training providers', 'universities'],
    regulatoryBodies: ['DOE', 'OFSTED', 'SEC', 'Accreditation Bodies'],
    entityTypes: ['EdTech Company', 'University', 'Training Provider', 'Publisher', 'Certification Body'],
    requiredKPIs: ['company_name', 'category', 'student_count', 'revenue_usd', 'geographic_coverage'],
    optionalKPIs: ['completion_rate', 'nps', 'partnerships', 'accreditation', 'content_library_size'],
    contactStages: ['demo', 'pilot', 'procurement', 'implementation', 'renewal'],
    legalEntityFormats: { 'US': 'Inc. / Non-profit 501(c)(3)', 'UK': 'Ltd. / Charity' },
    financialConstraints: [],
    defaultSearchQueries: (input: string) => [
      `"${input}" edtech education platform learning`,
      `"${input}" university college student enrollment`,
      `"${input}" training certification LMS`,
      `"${input}" partnership integration procurement`,
    ],
    schemaTemplate: { company_name: '', category: '', student_count: 0, revenue_usd: 0, geographic_coverage: '', kpis: {}, stages_contact_matrix: {} },
  },

  general: {
    domain: 'general',
    label: 'General Business Intelligence',
    description: 'General company research, contact finding, and business data extraction for any industry.',
    triggerKeywords: [],
    triggerPhrases: [],
    regulatoryBodies: [],
    entityTypes: ['Company', 'Organization', 'Person'],
    requiredKPIs: ['company_name', 'industry', 'website', 'description', 'location', 'contact_info'],
    optionalKPIs: ['revenue', 'employees', 'founded', 'tech_stack', 'funding', 'key_contacts'],
    contactStages: ['initial_contact', 'qualification', 'engagement'],
    legalEntityFormats: {},
    financialConstraints: [],
    defaultSearchQueries: (input: string) => [`"${input}" company business`, `"${input}" contact information`],
    schemaTemplate: { company_name: '', industry: '', website: '', description: '', location: '', contact_info: {}, kpis: {} },
  },
};

// ============================================================
// Domain Detection — Classify user query into a domain
// ============================================================

/**
 * Detect the most likely domain from a user's query.
 * Uses keyword density scoring + phrase matching.
 */
export function detectDomain(query: string): DomainSchema {
  const lowerQuery = query.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [domainKey, schema] of Object.entries(DOMAIN_SCHEMAS)) {
    if (domainKey === 'general') continue;
    let score = 0;
    let keywordMatches = 0;
    let phraseMatches = 0;
    let regulatoryMatches = 0;

    // Keyword matching (1 point per match — STRONG signal)
    for (const keyword of schema.triggerKeywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        score += 1;
        keywordMatches++;
      }
    }

    // Phrase matching (3 points per match — VERY STRONG signal)
    for (const phrase of schema.triggerPhrases) {
      if (lowerQuery.includes(phrase.toLowerCase())) {
        score += 3;
        phraseMatches++;
      }
    }

    // Regulatory body matching (2 points per match — STRICT match required)
    // IMPORTANT: We require the FULL regulatory body name to match, not just
    // the first word. Previously, "Health Canada" → "health" matched any text
    // containing "health" or "Healthcare", causing false positives like
    // "Healthcare & FinTech Systems" being misclassified as pharma_biotech.
    for (const reg of schema.regulatoryBodies) {
      const regLower = reg.toLowerCase();
      // Match the full name OR (for multi-word names) the full name as a phrase
      if (lowerQuery.includes(regLower)) {
        score += 2;
        regulatoryMatches++;
      }
    }

    scores[domainKey] = score;
  }

  // Find the highest scoring domain
  const bestDomain = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  // Require at least 2 different TYPES of matches (keyword + phrase, or
  // keyword + regulatory, etc.) to avoid false positives from a single
  // keyword match. Also require a minimum score of 3.
  if (bestDomain && bestDomain[1] >= 3) {
    const domainKey = bestDomain[0] as DomainType;
    const schema = DOMAIN_SCHEMAS[domainKey];
    // Re-count match types for the winner
    let keywordMatches = 0;
    let phraseMatches = 0;
    let regulatoryMatches = 0;
    for (const keyword of schema.triggerKeywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) keywordMatches++;
    }
    for (const phrase of schema.triggerPhrases) {
      if (lowerQuery.includes(phrase.toLowerCase())) phraseMatches++;
    }
    for (const reg of schema.regulatoryBodies) {
      if (lowerQuery.includes(reg.toLowerCase())) regulatoryMatches++;
    }
    const matchTypes = [keywordMatches > 0, phraseMatches > 0, regulatoryMatches > 0].filter(Boolean).length;
    if (matchTypes >= 2) {
      return schema;
    }
    // Single match type but score is high (>= 5) — accept anyway
    if (bestDomain[1] >= 5) {
      return schema;
    }
  }

  return DOMAIN_SCHEMAS.general;
}

/**
 * Check if a query is a specialized domain query requiring the 4-phase pipeline.
 */
export function isDomainSpecificQuery(query: string): boolean {
  const domain = detectDomain(query);
  return domain.domain !== 'general';
}

/**
 * Get the domain-specific search queries for a given input.
 * These are optimized for the domain's regulatory and data landscape.
 */
export function getDomainSearchQueries(query: string, domain: DomainSchema): string[] {
  // Extract the core entity/topic from the query
  const coreTopic = query.replace(/find|search|research|show|list|get|give me|who are|what are/gi, '').trim();
  return domain.defaultSearchQueries(coreTopic);
}

/**
 * Build the Phase 1 expanded intent specification.
 * This is the structured representation of what the user implicitly wants.
 */
export function expandIntent(query: string, domain: DomainSchema): string {
  return `DOMAIN: ${domain.label}
QUERY: "${query}"

INTENT EXPANSION:
The user is querying within the "${domain.label}" domain. The following data dimensions are implicitly requested:

REGULATORY BODIES TO CHECK: ${domain.regulatoryBodies.join(', ') || 'General business registries'}

ENTITY TYPES TO RESOLVE: ${domain.entityTypes.join(', ')}

REQUIRED KPIs TO FILL: ${domain.kpis.join(', ')}

OPTIONAL KPIs TO ENRICH: ${domain.optionalKPIs.join(', ')}

CONTACT STAGES TO MAP: ${domain.contactStages.join(' → ')}

LEGAL ENTITY FORMATS BY JURISDICTION: ${Object.entries(domain.legalEntityFormats).map(([k, v]) => `${k}: ${v}`).join('; ') || 'Standard corporate formats'}

FINANCIAL VALIDATION RULES:
${domain.financialConstraints.map(c => `- ${c.name}: ${c.rule} (${c.description})`).join('\n') || '- No domain-specific financial constraints'}

SEARCH QUERY EXPANSIONS:
${getDomainSearchQueries(query, domain).map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
}

/**
 * Build the Phase 3 financial validation prompt segment.
 * This enforces mathematical coherence and regulatory anchoring.
 */
export function getFinancialValidationPrompt(domain: DomainSchema): string {
  if (domain.financialConstraints.length === 0) return '';

  return `
FINANCIAL & REGULATORY VALIDATION RULES — STRICT COMPLIANCE REQUIRED:
Before emitting any data record, you MUST validate against these domain-specific constraints:
${domain.financialConstraints.map(c => `
- ${c.name}: ${c.rule}
  Explanation: ${c.description}
  Example: ${c.example}
`).join('\n')}
If any extracted data violates these rules, adjust the value to the nearest valid bound and note the correction.
Never emit mathematically impossible data (e.g., DPI > TVPI, dry powder > fund size, negative IRR for performing funds).`;
}

/**
 * Build the Phase 4 token-optimized output format specification.
 * This ensures the output is machine-parseable and maximally dense.
 */
export function getOutputFormatPrompt(domain: DomainSchema): string {
  return `
OUTPUT FORMAT — TOKEN-OPTIMIZED "WRITE MODE":
Your response MUST follow these strict formatting rules:

1. ZERO CONVERSATIONAL PADDING: Do NOT include introductory text, summaries, or closing remarks.
   Open IMMEDIATELY with a markdown code block containing the structured JSON data.

2. SCHEMA UNIFORMITY: Every record in the array MUST have identical keys, typing, and nesting.
   Missing values MUST be null — never omit keys. Empty arrays MUST be [] — never omitted.

3. REQUIRED FIELDS PER RECORD:
${domain.requiredKPIs.map(k => `   - "${k}": <type as defined in schema>`).join('\n')}

4. CONTACT STAGE MATRIX: Each record MUST include a "stages_contact_matrix" object with keys:
${domain.contactStages.map(s => `   - "${s}": { key_contact_person, title, email, phone_number, preferred_channel }`).join('\n')}

5. LP/INVESTOR NESTING: If the domain includes limited_partners or investors, each MUST have:
   - name, category/type, profession/role, investment_interest, estimated_allocation_usd, relationship_years

6. KPI OBJECT: Each record MUST include a "kpis" object with at minimum:
   - target_return_metric (domain-specific: IRR, cap rate, combined ratio, etc.)
   - historical_performance_metric (TVPI, DPI, MOIC, etc.)
   - average_deal_size_or_ticket_size_usd
   - active_portfolio_or_client_count

7. JURISDICTION MAPPING: The "registered_jurisdiction" field MUST map to the correct legal entity format:
${Object.entries(domain.legalEntityFormats).map(([country, format]) => `   - ${country}: ${format}`).join('\n') || '   - Use standard corporate entity format for the entity\'s country of registration'}

8. NEXT-STEP BLUEPRINT: After the JSON array, include a brief markdown section with:
   - "CONTINUATION": 3 specific next queries to expand the dataset
   - "GAPS": Fields most likely missing and how to fill them
   - "PRIORITY CONTACTS": Which contact stage is most actionable for outreach`;
}

/**
 * Generate the complete domain-specific think-mode system prompt.
 * This replaces the generic system prompt when a domain-specific query is detected.
 */
export function getDomainThinkModePrompt(query: string, domain: DomainSchema): string {
  return `You are an institutional-grade data synthesis engine operating in DOMAIN-SPECIFIC THINK MODE. The user has queried within the "${domain.label}" domain.

${expandIntent(query, domain)}

PIPELINE ARCHITECTURE:
You are executing a 4-phase vertical data-synthesis pipeline:

PHASE 1: INTENT MAPPING & EXPANSION ✅ (Completed above)
- Decoded implicit domain requests
- Formatted strict structural filters
- Mapped regulatory bodies and entity types

PHASE 2: MULTI-SOURCE DATA RETRIEVAL
- You MUST use real-time search endpoints to ground your data
- REJECT synthetic/stale data — only include verified information
- Cross-reference SEC Form ADV filings, FCA registries, BaFin notices, MAS circulars, and public regulatory disclosures
- Pull active parameters to capture live dry powder fluctuations, new fund vintages, updated leadership matrices
- If a specific data point cannot be verified from search results, mark it as null — NEVER fabricate

PHASE 3: FINANCIAL & REGULATORY ANCHORING
${getFinancialValidationPrompt(domain)}

PHASE 4: TOKEN-CONSTRAINED CHUNKING
- Optimize system memory layouts
- Pack maximum asset data per block
- Group records into optimized data chunks
- Preserve full nested objects without truncation
${getOutputFormatPrompt(domain)}

CRITICAL RULES:
1. NEVER invent data. Only state what you found from real search results or can confidently derive.
2. When uncertain, use null — do not guess specific numbers, names, or contact details.
3. Financial figures MUST be realistic and consistent with the domain's constraints.
4. Contact information MUST be sourced from real search results, not generated.
5. If multiple sources conflict, use the most authoritative source (regulatory filing > company website > blog post).
6. Always cite source URLs in a "sources" array at the end of each record.`;
}
