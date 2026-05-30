/**
 * LeadReach — Stripe Configuration & Plan Mapping
 * ================================================
 * Defines the mapping between LeadReach plans and Stripe Price IDs.
 */

import Stripe from 'stripe';

// Lazy-initialize Stripe to avoid build-time errors when STRIPE_SECRET_KEY is not set
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    });
  }
  return _stripe;
}

// Convenience alias for route handlers (only use in server-side code)
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  },
});

// ── Plan Definitions ──────────────────────────────────────────────

export interface PlanDefinition {
  id: string;
  name: string;
  displayName: string;
  track: 'b2b' | 'b2c';
  monthlyPrice: number;
  annualPrice: number;
  stripeMonthlyPriceId: string;
  stripeAnnualPriceId: string;
  stripeProductId: string;
  features: string[];
  includedLeads: number;
  includedAgents: number;
  includedChannels: number;
  includedTeamMembers: number;
  maxCampaigns: number;
  maxSetters: number;
  grade: 'free' | 'standard' | 'professional' | 'lifetime' | 'enterprise';
  highlight: boolean;
  badge: string | null;
  description: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'launchpad',
    name: 'launchpad',
    displayName: 'Launchpad',
    track: 'b2b',
    monthlyPrice: 0,
    annualPrice: 0,
    stripeMonthlyPriceId: '',
    stripeAnnualPriceId: '',
    stripeProductId: '',
    features: [
      '2 AI Agents (Orchestrator + Prospect Discovery)',
      '100 leads/month',
      '3 research channels (Web, LinkedIn, Exa)',
      'Basic ICP Builder', 'Basic Lead Scoring',
      'Standard support (email only)', '1 user seat',
      'LeadReach branding on outreach',
    ],
    includedLeads: 100, includedAgents: 2, includedChannels: 3,
    includedTeamMembers: 1, maxCampaigns: 1, maxSetters: 0,
    grade: 'free', highlight: false, badge: 'Free Forever',
    description: 'Explore AI-powered lead generation at zero cost — forever',
  },
  {
    id: 'scout',
    name: 'scout',
    displayName: 'Scout',
    track: 'b2b',
    monthlyPrice: 149,
    annualPrice: 1490,
    stripeMonthlyPriceId: 'price_1TcUhn4EhB9klcltVBOuFyzF',
    stripeAnnualPriceId: 'price_1TcUhn4EhB9klclthMcDHK5I',
    stripeProductId: 'prod_Ubi87Mluh1HTyD',
    features: [
      '3 AI Agents', '1,000 leads/month',
      '5 research channels (Web, LinkedIn, Exa, GitHub, Reddit)',
      'ICP Builder', 'Lead Scoring', 'Basic Enrichment',
      'Email Outreach', '1 user seat', 'Standard support',
    ],
    includedLeads: 1000, includedAgents: 3, includedChannels: 5,
    includedTeamMembers: 1, maxCampaigns: 3, maxSetters: 0,
    grade: 'standard', highlight: false, badge: null,
    description: 'For solo founders and small teams starting their outbound journey',
  },
  {
    id: 'command',
    name: 'command',
    displayName: 'Command',
    track: 'b2b',
    monthlyPrice: 399,
    annualPrice: 3990,
    stripeMonthlyPriceId: 'price_1TcUho4EhB9klcltTBKE0KBO',
    stripeAnnualPriceId: 'price_1TcUhp4EhB9klcltNzpAmOBU',
    stripeProductId: 'prod_Ubi8QC2314Ld6N',
    features: [
      '8 AI Agents', '10,000+ leads/month', 'All 17+ channels',
      'Advanced ICP & multi-dimensional scoring',
      'Deep enrichment (firmographics & technographics)',
      'Multi-step outreach (email + LinkedIn)', 'Pipeline management',
      'Competitive intel', '5 user seats', 'GHL & CRM integrations',
      'A/B testing', 'Priority support',
    ],
    includedLeads: 10000, includedAgents: 8, includedChannels: 17,
    includedTeamMembers: 5, maxCampaigns: -1, maxSetters: 3,
    grade: 'professional', highlight: true, badge: 'Most Popular',
    description: 'For growing teams scaling outbound with AI-powered automation',
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    track: 'b2b',
    monthlyPrice: 0,
    annualPrice: 0,
    stripeMonthlyPriceId: '',
    stripeAnnualPriceId: '',
    stripeProductId: 'prod_Ubi8b5UlskoM4u',
    features: [
      'Unlimited AI Agents & leads', 'Custom channels & data sources',
      'Custom AI model training', 'Advanced workflow orchestration',
      'White-label', 'Unlimited seats', 'Dedicated CSM', 'SLA (99.9%)',
      'Custom integrations & API', 'On-premise option',
    ],
    includedLeads: -1, includedAgents: -1, includedChannels: -1,
    includedTeamMembers: -1, maxCampaigns: -1, maxSetters: -1,
    grade: 'enterprise', highlight: false, badge: 'Custom',
    description: 'For enterprises requiring unlimited scale, custom agents, and dedicated support',
  },
  {
    id: 'founders-pass',
    name: 'founders-pass',
    displayName: "Founders' Pass",
    track: 'b2b',
    monthlyPrice: 2497,
    annualPrice: 2497,
    stripeMonthlyPriceId: '',
    stripeAnnualPriceId: '',
    stripeProductId: '',
    features: [
      'All 8 AI Agents — forever', '15,000 leads/month — lifetime',
      'All 17+ channels', 'Advanced ICP & multi-dimensional scoring',
      'Deep enrichment (firmographics & technographics)',
      'Multi-step outreach (email + LinkedIn)', 'Pipeline management',
      'Competitive intel', '5 user seats', 'GHL & CRM integrations',
      'A/B testing', 'API access', 'Priority support — forever',
      'All future platform updates included',
    ],
    includedLeads: 15000, includedAgents: 8, includedChannels: 17,
    includedTeamMembers: 5, maxCampaigns: -1, maxSetters: 5,
    grade: 'lifetime', highlight: true, badge: 'Lifetime Deal',
    description: 'One payment. Unlimited AI lead generation. Forever.',
  },
  {
    id: 'setter',
    name: 'setter',
    displayName: 'Setter',
    track: 'b2c',
    monthlyPrice: 97,
    annualPrice: 970,
    stripeMonthlyPriceId: 'price_1TcUhr4EhB9klclt3ajz0NZN',
    stripeAnnualPriceId: 'price_1TcUhr4EhB9klclteFhzfm1U',
    stripeProductId: 'prod_Ubi8low1f3ZoEK',
    features: [
      '2 AI Setters', '500 leads/month', 'SMS + Email channels',
      'Basic qualification', 'Conversational calendar booking',
      'Standard follow-up', '1 language', '1 user seat',
    ],
    includedLeads: 500, includedAgents: 2, includedChannels: 2,
    includedTeamMembers: 1, maxCampaigns: 1, maxSetters: 2,
    grade: 'standard', highlight: false, badge: null,
    description: 'For solopreneurs and small businesses automating appointment setting',
  },
  {
    id: 'closer',
    name: 'closer',
    displayName: 'Closer',
    track: 'b2c',
    monthlyPrice: 297,
    annualPrice: 2970,
    stripeMonthlyPriceId: 'price_1TcUhs4EhB9klcltbTQyccvx',
    stripeAnnualPriceId: 'price_1TcUhs4EhB9klcltSbS4Xkt8',
    stripeProductId: 'prod_Ubi8u6sEBmDuDl',
    features: [
      'Unlimited AI Setters', '10,000+ leads/month',
      'All channels (SMS, WhatsApp, IG, FB, Email)',
      'Advanced qualification & scoring', 'Real-time calendar sync',
      'Custom follow-up & nurture', '17+ languages', 'A/B testing',
      'GHL CRM integration', 'Custom AI tasks', '5 sub-accounts',
      'Priority support',
    ],
    includedLeads: 10000, includedAgents: -1, includedChannels: 5,
    includedTeamMembers: 5, maxCampaigns: -1, maxSetters: -1,
    grade: 'professional', highlight: true, badge: 'Most Popular',
    description: 'For teams and agencies scaling conversational booking and lead nurturing',
  },
  {
    id: 'agency',
    name: 'agency',
    displayName: 'Agency',
    track: 'b2c',
    monthlyPrice: 0,
    annualPrice: 0,
    stripeMonthlyPriceId: '',
    stripeAnnualPriceId: '',
    stripeProductId: 'prod_Ubi8R7OZN8id5Y',
    features: [
      'Unlimited AI Setters & leads', 'Unlimited sub-accounts',
      'White-label', 'Custom integrations & API', 'Dedicated CSM',
      'SLA', 'Custom AI training', 'Multi-brand management',
      'Bulk operations', '24/7 support',
    ],
    includedLeads: -1, includedAgents: -1, includedChannels: -1,
    includedTeamMembers: -1, maxCampaigns: -1, maxSetters: -1,
    grade: 'enterprise', highlight: false, badge: 'Custom',
    description: 'For agencies managing multiple brands with white-label capabilities',
  },
];

// ── Helper Functions ──────────────────────────────────────────────

export function getPlanById(planId: string): PlanDefinition | undefined {
  return PLANS.find(p => p.id === planId);
}

export function getPlansByTrack(track: 'b2b' | 'b2c'): PlanDefinition[] {
  return PLANS.filter(p => p.track === track);
}

export function getPlanByStripePriceId(priceId: string): PlanDefinition | undefined {
  return PLANS.find(p => p.stripeMonthlyPriceId === priceId || p.stripeAnnualPriceId === priceId);
}

export function getStripePriceId(planId: string, cycle: 'monthly' | 'annual'): string | null {
  const plan = getPlanById(planId);
  if (!plan) return null;
  return cycle === 'annual' ? plan.stripeAnnualPriceId : plan.stripeMonthlyPriceId;
}

export function getFeatureAccess(planTier: string): {
  views: string[];
  maxCampaigns: number;
  maxLeads: number;
  maxAgents: number;
  maxSetters: number;
  maxTeamMembers: number;
} {
  const plan = getPlanById(planTier);
  if (!plan) {
    return {
      views: ['dashboard', 'prospect-discovery', 'icp', 'leads'],
      maxCampaigns: 1, maxLeads: 100, maxAgents: 1, maxSetters: 0, maxTeamMembers: 1,
    };
  }

  const baseViews = ['dashboard', 'prospect-discovery', 'icp', 'leads', 'reports'];

  if (plan.grade === 'free') {
    return {
      views: [...baseViews, 'campaigns'],
      maxCampaigns: plan.maxCampaigns, maxLeads: plan.includedLeads,
      maxAgents: plan.includedAgents, maxSetters: plan.maxSetters,
      maxTeamMembers: plan.includedTeamMembers,
    };
  }

  if (plan.grade === 'standard') {
    return {
      views: [...baseViews, 'campaigns', 'outreach', 'data-enrichment'],
      maxCampaigns: plan.maxCampaigns, maxLeads: plan.includedLeads,
      maxAgents: plan.includedAgents, maxSetters: plan.maxSetters,
      maxTeamMembers: plan.includedTeamMembers,
    };
  }

  if (plan.grade === 'professional' || plan.grade === 'lifetime') {
    return {
      views: [...baseViews, 'campaigns', 'outreach', 'data-enrichment', 'agents', 'setter', 'booking', 'messaging', 'analytics'],
      maxCampaigns: plan.maxCampaigns, maxLeads: plan.includedLeads,
      maxAgents: plan.includedAgents, maxSetters: plan.maxSetters,
      maxTeamMembers: plan.includedTeamMembers,
    };
  }

  return {
    views: ['dashboard', 'prospect-discovery', 'icp', 'campaigns', 'leads', 'data-enrichment', 'agents', 'setter', 'booking', 'messaging', 'outreach', 'analytics', 'reports'],
    maxCampaigns: -1, maxLeads: -1, maxAgents: -1, maxSetters: -1, maxTeamMembers: -1,
  };
}

export function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive';
  plan: string;
} {
  switch (stripeStatus) {
    case 'active': return { status: 'active', plan: 'paid' };
    case 'trialing': return { status: 'trialing', plan: 'trial' };
    case 'past_due': return { status: 'past_due', plan: 'paid' };
    case 'canceled': return { status: 'canceled', plan: 'free' };
    case 'unpaid': return { status: 'inactive', plan: 'free' };
    case 'incomplete': case 'incomplete_expired': return { status: 'inactive', plan: 'free' };
    case 'paused': return { status: 'inactive', plan: 'free' };
    default: return { status: 'inactive', plan: 'free' };
  }
}
