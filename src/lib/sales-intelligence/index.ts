/**
 * Sales Intelligence Integration Module
 *
 * Integrates the ai-sales-team-claude repository's capabilities
 * into the LeadReach AI platform. Provides:
 *
 * 1. BANT + MEDDIC Lead Scoring
 * 2. Contact Buying Role Classification
 * 3. Tech Stack & Industry Detection
 * 4. Sales Agent Prompts (for AI assistant integration)
 *
 * Source: ai-sales-team-claude/ (GitHub: zubair-trabzada/ai-sales-team-claude)
 */

export { scoreLead, leadToScoringInput } from './lead-scorer';
export type { ScoringInput, ScoringResult, BANTBreakdown, MEDDICCompleteness } from './lead-scorer';

export {
  classifyContact,
  classifyContacts,
  classifySeniority,
  classifyDepartment,
  predictBuyingRole,
  getOutreachStrategy,
  getAllRoleStrategies,
} from './contact-classifier';
export type { ContactClassification, RoleOutreachStrategy } from './contact-classifier';

export {
  detectTechStack,
  detectIndustry,
  extractSocialLinks,
  extractContactInfo,
  estimateCompanySize,
} from './tech-detector';

// ─────────────────────────────────────────────────────────────
// Sales Agent Prompt Registry
// Used by the AI assistant to invoke sales intelligence capabilities
// ─────────────────────────────────────────────────────────────

export const SALES_COMMANDS = {
  prospect: {
    description: 'Full prospect audit with 5 parallel analysis agents (Company, Contacts, Opportunity, Competitive, Strategy)',
    usage: '/sales prospect <url or company name>',
    output: 'Comprehensive prospect analysis with BANT+MEDDIC scoring, buying committee map, outreach strategy',
  },
  quick: {
    description: '60-second prospect snapshot with quick scorecard',
    usage: '/sales quick <url or company name>',
    output: 'Quick scorecard with top 3 opportunities and top 3 concerns',
  },
  research: {
    description: 'Deep company research & firmographics (8 dimensions)',
    usage: '/sales research <url or company name>',
    output: 'Company research report with revenue estimation, tech stack, growth signals',
  },
  qualify: {
    description: 'Lead qualification using BANT + MEDDIC frameworks',
    usage: '/sales qualify <url or company name>',
    output: 'Lead qualification report with score, grade, gaps, and recommended action',
  },
  contacts: {
    description: 'Decision maker identification and buying committee mapping',
    usage: '/sales contacts <url or company name>',
    output: 'Contact map with buying roles, personalization anchors, multi-threading strategy',
  },
  outreach: {
    description: 'Generate 5-email cold outreach sequence with LinkedIn touchpoints',
    usage: '/sales outreach <prospect>',
    output: 'Ready-to-send cold email sequence with A/B test variations',
  },
  followup: {
    description: 'Generate follow-up email sequences for 5 scenarios',
    usage: '/sales followup <prospect>',
    output: 'Follow-up sequence (post-meeting, post-demo, ghost recovery, nurture)',
  },
  prep: {
    description: 'Meeting preparation brief with cheat sheet and discovery questions',
    usage: '/sales prep <url or company name>',
    output: 'Meeting prep with attendee profiles, talking points, objection responses',
  },
  proposal: {
    description: 'Client proposal generator with 3-tier pricing and ROI projection',
    usage: '/sales proposal <client>',
    output: 'Professional sales proposal with investment tiers and ROI scenarios',
  },
  objections: {
    description: 'Objection handling playbook with word-for-word scripts',
    usage: '/sales objections <topic>',
    output: 'Objection playbook with LAER framework responses and walk-away criteria',
  },
  icp: {
    description: 'Ideal Customer Profile builder with negative ICP',
    usage: '/sales icp <business description>',
    output: 'ICP with scoring rubric, buyer personas, prospecting playbook, negative ICP',
  },
  competitors: {
    description: 'Competitive intelligence and battle card generation',
    usage: '/sales competitors <url or company name>',
    output: 'Battle cards, switching cost analysis, feature gap comparison',
  },
} as const;

export type SalesCommand = keyof typeof SALES_COMMANDS;
