/**
 * Contact Classifier — Buying Committee & Seniority Classification
 *
 * Ported from ai-sales-team-claude/scripts/contact_finder.py
 * Classifies job titles into seniority levels, departments, and buying roles.
 *
 * Used by:
 * - /api/sales-intelligence/classify-contacts
 * - Lead enrichment pipeline (auto-classify contacts)
 * - Outreach system (role-based messaging)
 */

// ─────────────────────────────────────────────────────────────
// Seniority Classification
// ─────────────────────────────────────────────────────────────

const SENIORITY_MAP: Record<string, string[]> = {
  'C-Suite': ['ceo', 'cto', 'cfo', 'coo', 'cmo', 'cpo', 'cro', 'ciso',
    'chief', 'founder', 'co-founder', 'cofounder', 'president',
    'managing director', 'general manager', 'partner'],
  'VP': ['vice president', 'vp ', 'vp,', 'svp', 'evp', 'head of'],
  'Director': ['director', 'senior director', 'group director'],
  'Manager': ['manager', 'senior manager', 'team lead', 'lead'],
  'IC': ['engineer', 'analyst', 'specialist', 'coordinator', 'designer',
    'developer', 'associate', 'consultant', 'architect'],
};

export function classifySeniority(title: string): string {
  const lower = title.toLowerCase();
  for (const [level, keywords] of Object.entries(SENIORITY_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return level;
    }
  }
  return 'Unknown';
}

// ─────────────────────────────────────────────────────────────
// Department Classification
// ─────────────────────────────────────────────────────────────

const DEPARTMENT_MAP: Record<string, string[]> = {
  'Engineering': ['engineering', 'developer', 'software', 'devops', 'infrastructure',
    'platform', 'architect', 'cto', 'technical', 'frontend', 'backend'],
  'Sales': ['sales', 'business development', 'account executive', 'account manager',
    'revenue', 'cro', 'partnerships'],
  'Marketing': ['marketing', 'growth', 'brand', 'content', 'cmo', 'communications',
    'demand gen', 'pr', 'public relations'],
  'Product': ['product', 'cpo', 'product manager', 'product design', 'ux', 'ui'],
  'Operations': ['operations', 'coo', 'ops', 'supply chain', 'logistics'],
  'Finance': ['finance', 'cfo', 'accounting', 'controller', 'treasurer', 'investor relations'],
  'HR': ['human resources', 'hr', 'people', 'talent', 'recruiting', 'culture'],
  'Legal': ['legal', 'counsel', 'compliance', 'general counsel'],
  'Customer Success': ['customer success', 'customer support', 'client services', 'support'],
};

export function classifyDepartment(title: string): string {
  const lower = title.toLowerCase();
  for (const [dept, keywords] of Object.entries(DEPARTMENT_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return dept;
    }
  }
  return 'Unknown';
}

// ─────────────────────────────────────────────────────────────
// Buying Role Prediction
// ─────────────────────────────────────────────────────────────

const BUYING_ROLES: Record<string, string[]> = {
  'Economic Buyer': ['ceo', 'cfo', 'coo', 'president', 'founder', 'managing director',
    'general manager', 'partner', 'owner'],
  'Champion': ['vp', 'vice president', 'head of', 'director', 'senior director'],
  'Evaluator': ['manager', 'senior manager', 'team lead', 'lead', 'principal'],
  'End User': ['engineer', 'analyst', 'specialist', 'developer', 'designer'],
  'Blocker': ['legal', 'counsel', 'compliance', 'procurement', 'purchasing'],
};

export function predictBuyingRole(title: string): string {
  const lower = title.toLowerCase();
  for (const [role, keywords] of Object.entries(BUYING_ROLES)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return role;
    }
  }
  return 'Unknown';
}

// ─────────────────────────────────────────────────────────────
// Full Classification
// ─────────────────────────────────────────────────────────────

export interface ContactClassification {
  name: string;
  title: string;
  seniority: string;
  department: string;
  buyingRole: string;
  seniorityOrder: number;
}

const SENIORITY_ORDER: Record<string, number> = {
  'C-Suite': 0, 'VP': 1, 'Director': 2, 'Manager': 3, 'IC': 4, 'Unknown': 5,
};

export function classifyContact(name: string, title: string): ContactClassification {
  const seniority = classifySeniority(title);
  return {
    name,
    title,
    seniority,
    department: classifyDepartment(title),
    buyingRole: predictBuyingRole(title),
    seniorityOrder: SENIORITY_ORDER[seniority] ?? 5,
  };
}

export function classifyContacts(contacts: Array<{ name: string; title: string }>): ContactClassification[] {
  return contacts
    .map(c => classifyContact(c.name, c.title))
    .sort((a, b) => a.seniorityOrder - b.seniorityOrder);
}

// ─────────────────────────────────────────────────────────────
// Outreach Strategy per Buying Role
// ─────────────────────────────────────────────────────────────

export interface RoleOutreachStrategy {
  buyingRole: string;
  messageAngle: string;
  tone: string;
  ctaStyle: string;
  whatNotToSay: string;
  priority: number;
}

const ROLE_STRATEGIES: RoleOutreachStrategy[] = [
  {
    buyingRole: 'Economic Buyer',
    messageAngle: 'ROI, cost savings, revenue impact, strategic value',
    tone: 'Executive-level, concise, data-driven',
    ctaStyle: 'Brief strategic discussion (15 min)',
    whatNotToSay: 'Technical details, feature lists, implementation specifics',
    priority: 1,
  },
  {
    buyingRole: 'Champion',
    messageAngle: 'Personal success, team productivity, making their vision happen',
    tone: 'Collaborative, supportive, peer-level',
    ctaStyle: 'Share how similar teams solved this (quick chat)',
    whatNotToSay: 'Bypassing them to their boss, anything that makes them feel displaced',
    priority: 2,
  },
  {
    buyingRole: 'Evaluator',
    messageAngle: 'Technical superiority, integration ease, proof of concept results',
    tone: 'Technical but approachable, evidence-based',
    ctaStyle: 'Technical deep-dive or demo',
    whatNotToSay: 'Hype, vague claims, competitor bashing without proof',
    priority: 3,
  },
  {
    buyingRole: 'End User',
    messageAngle: 'Ease of use, time savings, better daily workflow',
    tone: 'Casual, relatable, user-centric',
    ctaStyle: 'Free trial or quick walkthrough',
    whatNotToSay: 'Long sales cycles, complex implementation, steep learning curves',
    priority: 4,
  },
  {
    buyingRole: 'Blocker',
    messageAngle: 'Compliance, security, risk reduction, governance',
    tone: 'Professional, detail-oriented, risk-aware',
    ctaStyle: 'Security review or compliance documentation',
    whatNotToSay: 'Downplaying their concerns, rushing past compliance requirements',
    priority: 5,
  },
];

export function getOutreachStrategy(buyingRole: string): RoleOutreachStrategy | undefined {
  return ROLE_STRATEGIES.find(s => s.buyingRole === buyingRole);
}

export function getAllRoleStrategies(): RoleOutreachStrategy[] {
  return ROLE_STRATEGIES;
}
