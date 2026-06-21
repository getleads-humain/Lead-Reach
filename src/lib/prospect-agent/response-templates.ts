// ============================================================
// Response Templates — Incremental KPI Fields for Each Intent
// ============================================================
// Each unique user query type has a templated response with
// empty KPI fields that get populated step-by-step as data is
// obtained/generated/gathered/researched during the pipeline.
// ============================================================

import type { UserIntent } from './types';

// ============================================================
// Template Field Definition
// ============================================================

export interface TemplateField {
  key: string;               // Field identifier (maps to ProspectResult/ICPResult/etc keys)
  label: string;             // Human-readable label
  source: string;            // Which agent fills this field (atlas, scout, forge, sage, judge, bard, flow, echo)
  filled: boolean;           // Whether data has been populated
  value?: string | string[] | number | null;  // Current value
  placeholder?: string;      // Placeholder text when empty
}

export interface ResponseTemplate {
  intent: UserIntent;
  title: string;             // Template section title
  description: string;       // Brief description of this template
  icon: string;              // Icon name for UI
  sections: TemplateSection[];
}

export interface TemplateSection {
  key: string;               // Section identifier
  title: string;             // Section heading
  icon: string;              // Icon name
  fields: TemplateField[];
}

// ============================================================
// Templates for Each Intent Type
// ============================================================

const RESEARCH_COMPANY_TEMPLATE: ResponseTemplate = {
  intent: 'research_company',
  title: 'Company Research',
  description: 'Comprehensive company profile with contact, firmographics, and digital presence',
  icon: 'Building2',
  sections: [
    {
      key: 'identity',
      title: 'Company Identity',
      icon: 'Building2',
      fields: [
        { key: 'companyName', label: 'Company Name', source: 'scout', filled: false, placeholder: 'Discovering...' },
        { key: 'description', label: 'Description', source: 'scout', filled: false, placeholder: 'Researching...' },
        { key: 'industry', label: 'Industry', source: 'scout', filled: false, placeholder: 'Classifying...' },
        { key: 'website', label: 'Website', source: 'scout', filled: false, placeholder: 'Locating...' },
      ],
    },
    {
      key: 'contact',
      title: 'Contact Information',
      icon: 'Mail',
      fields: [
        { key: 'generalEmail', label: 'Email', source: 'scout', filled: false, placeholder: 'Searching...' },
        { key: 'phoneMain', label: 'Phone', source: 'forge', filled: false, placeholder: 'Searching...' },
        { key: 'city', label: 'City', source: 'scout', filled: false, placeholder: 'Locating...' },
        { key: 'country', label: 'Country', source: 'scout', filled: false, placeholder: 'Locating...' },
      ],
    },
    {
      key: 'firmographics',
      title: 'Firmographics',
      icon: 'BarChart3',
      fields: [
        { key: 'employeeCount', label: 'Employees', source: 'forge', filled: false, placeholder: 'Enriching...' },
        { key: 'revenueEstimate', label: 'Revenue', source: 'forge', filled: false, placeholder: 'Estimating...' },
        { key: 'fundingInfo', label: 'Funding', source: 'sage', filled: false, placeholder: 'Researching...' },
      ],
    },
    {
      key: 'people',
      title: 'Key People',
      icon: 'Users',
      fields: [
        { key: 'ceoName', label: 'CEO', source: 'forge', filled: false, placeholder: 'Identifying...' },
        { key: 'ceoEmail', label: 'CEO Email', source: 'forge', filled: false, placeholder: 'Searching...' },
      ],
    },
    {
      key: 'digital',
      title: 'Digital Presence',
      icon: 'Globe',
      fields: [
        { key: 'linkedinUrl', label: 'LinkedIn', source: 'scout', filled: false, placeholder: 'Searching...' },
        { key: 'twitterHandle', label: 'Twitter/X', source: 'forge', filled: false, placeholder: 'Searching...' },
      ],
    },
    {
      key: 'products',
      title: 'Products & Tech',
      icon: 'FileText',
      fields: [
        { key: 'productsServices', label: 'Products/Services', source: 'scout', filled: false, placeholder: 'Discovering...' },
        { key: 'techStack', label: 'Tech Stack', source: 'forge', filled: false, placeholder: 'Analyzing...' },
      ],
    },
  ],
};

const RESEARCH_PERSON_TEMPLATE: ResponseTemplate = {
  intent: 'research_person',
  title: 'Person Research',
  description: 'Professional profile with contact details and career information',
  icon: 'User',
  sections: [
    {
      key: 'identity',
      title: 'Person Identity',
      icon: 'User',
      fields: [
        { key: 'personName', label: 'Full Name', source: 'scout', filled: false, placeholder: 'Discovering...' },
        { key: 'personTitle', label: 'Title / Role', source: 'scout', filled: false, placeholder: 'Researching...' },
        { key: 'personBio', label: 'Bio', source: 'scout', filled: false, placeholder: 'Searching...' },
        { key: 'companyName', label: 'Company', source: 'scout', filled: false, placeholder: 'Identifying...' },
      ],
    },
    {
      key: 'contact',
      title: 'Contact Information',
      icon: 'Mail',
      fields: [
        { key: 'generalEmail', label: 'Email', source: 'forge', filled: false, placeholder: 'Searching...' },
        { key: 'linkedinUrl', label: 'LinkedIn', source: 'scout', filled: false, placeholder: 'Locating...' },
        { key: 'twitterHandle', label: 'Twitter/X', source: 'forge', filled: false, placeholder: 'Searching...' },
      ],
    },
    {
      key: 'professional',
      title: 'Professional Details',
      icon: 'Briefcase',
      fields: [
        { key: 'industry', label: 'Industry', source: 'forge', filled: false, placeholder: 'Classifying...' },
        { key: 'city', label: 'Location', source: 'forge', filled: false, placeholder: 'Locating...' },
      ],
    },
  ],
};

const ANALYZE_MARKET_TEMPLATE: ResponseTemplate = {
  intent: 'analyze_market',
  title: 'Market Analysis',
  description: 'Market landscape, trends, key findings, and competitive dynamics',
  icon: 'TrendingUp',
  sections: [
    {
      key: 'overview',
      title: 'Market Overview',
      icon: 'TrendingUp',
      fields: [
        { key: 'query', label: 'Market', source: 'atlas', filled: false, placeholder: 'Analyzing...' },
        { key: 'summary', label: 'Summary', source: 'sage', filled: false, placeholder: 'Researching...' },
      ],
    },
    {
      key: 'findings',
      title: 'Key Findings',
      icon: 'Lightbulb',
      fields: [
        { key: 'keyFindings', label: 'Findings', source: 'sage', filled: false, placeholder: 'Gathering insights...' },
      ],
    },
  ],
};

const SCORE_LEAD_TEMPLATE: ResponseTemplate = {
  intent: 'score_lead',
  title: 'Lead Scoring',
  description: 'Multi-dimensional lead qualification and fit assessment',
  icon: 'Shield',
  sections: [
    {
      key: 'score',
      title: 'Overall Score',
      icon: 'Shield',
      fields: [
        { key: 'overallScore', label: 'Score', source: 'judge', filled: false, placeholder: 'Calculating...' },
        { key: 'tier', label: 'Tier', source: 'judge', filled: false, placeholder: 'Evaluating...' },
      ],
    },
    {
      key: 'dimensions',
      title: 'Scoring Dimensions',
      icon: 'BarChart3',
      fields: [
        { key: 'dimensions', label: 'Dimensions', source: 'judge', filled: false, placeholder: 'Scoring each dimension...' },
      ],
    },
  ],
};

const COMPOSE_OUTREACH_TEMPLATE: ResponseTemplate = {
  intent: 'compose_outreach',
  title: 'Outreach Composition',
  description: 'Personalized outreach message tailored to the prospect',
  icon: 'Mail',
  sections: [
    {
      key: 'message',
      title: 'Outreach Message',
      icon: 'Mail',
      fields: [
        { key: 'channel', label: 'Channel', source: 'bard', filled: false, placeholder: 'Selecting channel...' },
        { key: 'tone', label: 'Tone', source: 'bard', filled: false, placeholder: 'Choosing tone...' },
        { key: 'subject', label: 'Subject', source: 'bard', filled: false, placeholder: 'Composing...' },
        { key: 'body', label: 'Message Body', source: 'bard', filled: false, placeholder: 'Writing...' },
      ],
    },
  ],
};

const BUILD_ICP_TEMPLATE: ResponseTemplate = {
  intent: 'build_icp',
  title: 'ICP Builder',
  description: 'Ideal Customer Profile with firmographic, psychographic, and behavioral criteria',
  icon: 'Target',
  sections: [
    {
      key: 'profile',
      title: 'ICP Profile',
      icon: 'Target',
      fields: [
        { key: 'name', label: 'ICP Name', source: 'atlas', filled: false, placeholder: 'Defining...' },
        { key: 'description', label: 'Description', source: 'sage', filled: false, placeholder: 'Analyzing...' },
      ],
    },
    {
      key: 'criteria',
      title: 'Selection Criteria',
      icon: 'Briefcase',
      fields: [
        { key: 'industries', label: 'Industries', source: 'sage', filled: false, placeholder: 'Identifying...' },
        { key: 'companySizes', label: 'Company Sizes', source: 'sage', filled: false, placeholder: 'Categorizing...' },
        { key: 'challenges', label: 'Challenges', source: 'sage', filled: false, placeholder: 'Analyzing...' },
        { key: 'buyingSignals', label: 'Buying Signals', source: 'sage', filled: false, placeholder: 'Detecting...' },
      ],
    },
  ],
};

const ANALYZE_COMPETITORS_TEMPLATE: ResponseTemplate = {
  intent: 'analyze_competitors',
  title: 'Competitive Analysis',
  description: 'Competitor landscape, strengths, weaknesses, and positioning',
  icon: 'BarChart3',
  sections: [
    {
      key: 'landscape',
      title: 'Competitive Landscape',
      icon: 'BarChart3',
      fields: [
        { key: 'query', label: 'Market', source: 'atlas', filled: false, placeholder: 'Analyzing...' },
        { key: 'summary', label: 'Landscape Summary', source: 'sage', filled: false, placeholder: 'Researching...' },
      ],
    },
    {
      key: 'findings',
      title: 'Competitive Insights',
      icon: 'Lightbulb',
      fields: [
        { key: 'keyFindings', label: 'Key Findings', source: 'sage', filled: false, placeholder: 'Gathering insights...' },
      ],
    },
  ],
};

// ============================================================
// Template Registry
// ============================================================

const TEMPLATE_REGISTRY: Record<string, ResponseTemplate> = {
  research_company: RESEARCH_COMPANY_TEMPLATE,
  research_person: RESEARCH_PERSON_TEMPLATE,
  research_url: RESEARCH_COMPANY_TEMPLATE, // URL research produces company data
  analyze_market: ANALYZE_MARKET_TEMPLATE,
  analyze_competitors: ANALYZE_COMPETITORS_TEMPLATE,
  build_icp: BUILD_ICP_TEMPLATE,
  score_lead: SCORE_LEAD_TEMPLATE,
  compose_outreach: COMPOSE_OUTREACH_TEMPLATE,
  // These intents don't get templates — they're conversational
  refine_search: RESEARCH_COMPANY_TEMPLATE,
  add_to_pipeline: RESEARCH_COMPANY_TEMPLATE,
};

/**
 * Get the response template for a given intent.
 * Returns null for conversational intents (clarify, converse) that don't use templates.
 */
export function getTemplateForIntent(intent: UserIntent): ResponseTemplate | null {
  const template = TEMPLATE_REGISTRY[intent];
  if (!template) return null;
  // Deep clone so each instance is independent
  return JSON.parse(JSON.stringify(template));
}

/**
 * Check if an intent should display a templated response.
 */
export function intentHasTemplate(intent: UserIntent): boolean {
  return intent in TEMPLATE_REGISTRY;
}

/**
 * Map a data source (agent name) to the fields it fills in a template.
 * Used by the UI to progressively fill template fields as agents report data.
 */
export function getFieldsForSource(template: ResponseTemplate, source: string): TemplateField[] {
  const fields: TemplateField[] = [];
  for (const section of template.sections) {
    for (const field of section.fields) {
      if (field.source === source) {
        fields.push(field);
      }
    }
  }
  return fields;
}

/**
 * Update template fields with actual data from the pipeline.
 * Returns the updated template with fields marked as filled.
 */
export function updateTemplateWithData(
  template: ResponseTemplate,
  data: {
    prospect?: Record<string, unknown>;
    icp?: Record<string, unknown>;
    score?: Record<string, unknown>;
    outreach?: Record<string, unknown>;
    market?: Record<string, unknown>;
  }
): ResponseTemplate {
  const updated = JSON.parse(JSON.stringify(template)) as ResponseTemplate;

  for (const section of updated.sections) {
    for (const field of section.fields) {
      // Determine which data source to check
      let dataSource: Record<string, unknown> | undefined;
      if (field.key in (data.prospect || {})) dataSource = data.prospect;
      else if (field.key in (data.icp || {})) dataSource = data.icp;
      else if (field.key in (data.score || {})) dataSource = data.score;
      else if (field.key in (data.outreach || {})) dataSource = data.outreach;
      else if (field.key in (data.market || {})) dataSource = data.market;

      if (dataSource && field.key in dataSource) {
        const value = dataSource[field.key];
        if (value !== null && value !== undefined && value !== '' &&
            !(Array.isArray(value) && value.length === 0)) {
          field.filled = true;
          field.value = value as string | string[] | number;
        }
      }
    }
  }

  return updated;
}

/**
 * Calculate the fill percentage of a template (how many fields are populated).
 */
export function getTemplateFillPercentage(template: ResponseTemplate): number {
  let total = 0;
  let filled = 0;
  for (const section of template.sections) {
    for (const field of section.fields) {
      total++;
      if (field.filled) filled++;
    }
  }
  return total === 0 ? 0 : Math.round((filled / total) * 100);
}
