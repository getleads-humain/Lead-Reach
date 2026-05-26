// ============================================================
// Prospect Discovery Agent — Type Definitions
// ============================================================

/**
 * The specialized agent persona that handles the conversation.
 * Each persona has distinct capabilities, system prompts, and action sets.
 */
export type AgentPersona =
  | 'scout'     // Company research & discovery
  | 'hound'     // Person research & contact finding
  | 'analyst'   // Market research & competitive analysis
  | 'architect' // ICP building & refinement
  | 'judge'     // Lead qualification & scoring
  | 'scribe'    // Outreach composition
  | 'navigator'; // General guidance, clarification, multi-step orchestration

/**
 * The classified intent of a user message.
 * Determines which action pipeline the agent executes.
 */
export type UserIntent =
  | 'research_company'     // "Tell me about Acme Corp" / "Research Stripe"
  | 'research_person'      // "Find info on John Smith" / "Look up Elon Musk"
  | 'research_url'         // "Analyze https://example.com"
  | 'analyze_market'       // "What's the SaaS market in Berlin?" / "Industry trends in fintech"
  | 'analyze_competitors'  // "Who are Stripe's competitors?" / "Compare HubSpot vs Salesforce"
  | 'build_icp'            // "Build an ICP for SaaS companies" / "Define my ideal customer"
  | 'score_lead'           // "Is this a good lead?" / "Score this company against my ICP"
  | 'compose_outreach'     // "Write an email to Acme Corp" / "Draft a LinkedIn message"
  | 'refine_search'        // "Show me more like this" / "Find similar companies"
  | 'add_to_pipeline'      // "Add this to my leads" / "Convert to lead"
  | 'clarify'              // Vague queries needing clarification
  | 'converse';            // General conversation / follow-up questions

/**
 * An action the agent can take. Each intent maps to one or more actions.
 */
export interface AgentAction {
  type: UserIntent;
  label: string;             // Human-readable action name for UI display
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;           // What the agent is doing / did
  result?: unknown;          // Action result data
}

/**
 * The thinking/planning output from the agent before it executes actions.
 * Shown to the user as "Agent is thinking..." content.
 */
export interface AgentThinking {
  persona: AgentPersona;
  intent: UserIntent;
  reasoning: string;         // Why the agent chose this intent
  plan: string[];            // Step-by-step plan the agent will execute
  clarifyingQuestion?: string; // If intent is 'clarify', the question to ask
  confidence: number;        // 0-1 confidence in intent classification
}

/**
 * A conversation message in the agent chat.
 * Extends the basic chat model with agent-specific metadata.
 */
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;

  // Agent-specific fields
  persona?: AgentPersona;          // Which agent persona responded
  thinking?: AgentThinking;        // Agent's reasoning (shown in thinking mode)
  actions?: AgentAction[];         // Actions the agent took
  prospectData?: ProspectResult;   // Discovered prospect data
  icpData?: ICPResult;             // Built ICP data
  outreachData?: OutreachResult;   // Composed outreach message
  marketData?: MarketResult;       // Market analysis data
  scoreData?: ScoreResult;         // Lead scoring result

  // Pipeline fields
  converted?: boolean;
  leadId?: string;
}

/**
 * Result of a prospect research action.
 */
export interface ProspectResult {
  queryType: string;
  query: string;
  companyName: string | null;
  legalName: string | null;
  website: string | null;
  industry: string | null;
  subIndustry: string | null;
  description: string | null;
  hqAddress: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  postalCode: string | null;
  phoneMain: string | null;
  generalEmail: string | null;
  supportEmail: string | null;
  ceoName: string | null;
  ceoEmail: string | null;
  keyContactName: string | null;
  keyContactTitle: string | null;
  keyContactEmail: string | null;
  employeeCount: string | null;
  revenueEstimate: string | null;
  foundingYear: string | null;
  ownershipType: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  facebookPage: string | null;
  techStack: string[];
  boardMembers: string[];
  recentNews: string[];
  productsServices: string[];
  partners: string[];
  fundingInfo: string | null;
  personName: string | null;
  personTitle: string | null;
  personCompany: string | null;
  personEmail: string | null;
  personPhone: string | null;
  personLinkedin: string | null;
  personBio: string | null;
  sources: string[];
  dataCompleteness: number;
}

/**
 * Result of an ICP building action.
 */
export interface ICPResult {
  name: string;
  description: string;
  firmographic: {
    industries: string[];
    companySizes: string[];
    locations: string[];
    revenueRange: string;
  };
  technographic: {
    requiredTech: string[];
    preferredTech: string[];
  };
  psychographic: {
    values: string[];
    challenges: string[];
    goals: string[];
  };
  behavioral: {
    buyingSignals: string[];
    engagementPatterns: string[];
  };
  economic: {
    budgetRange: string;
    decisionTimeline: string;
  };
  criteria: string; // Raw JSON criteria for storage
}

/**
 * Result of an outreach composition action.
 */
export interface OutreachResult {
  channel: string;       // email, linkedin, phone
  subject: string;
  body: string;
  tone: string;
  personalizationHooks: string[];
  cta: string;
}

/**
 * Result of a market/competitive analysis action.
 */
export interface MarketResult {
  query: string;
  summary: string;
  keyFindings: string[];
  competitors: Array<{
    name: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  trends: string[];
  opportunities: string[];
  sources: string[];
}

/**
 * Result of a lead scoring action.
 */
export interface ScoreResult {
  overallScore: number;
  tier: 'ideal' | 'strong' | 'moderate' | 'weak' | 'poor';
  dimensions: {
    firmographic: { score: number; reasoning: string };
    technographic: { score: number; reasoning: string };
    psychographic: { score: number; reasoning: string };
    behavioral: { score: number; reasoning: string };
    situational: { score: number; reasoning: string };
    economic: { score: number; reasoning: string };
  };
  recommendation: string;
}

/**
 * The complete response from the agent chat API.
 */
export interface AgentChatResponse {
  message: AgentMessage;
  suggestedActions?: SuggestedAction[];
}

/**
 * Suggested follow-up actions the user can take after an agent response.
 */
export interface SuggestedAction {
  label: string;
  prompt: string;     // What to send as the next user message
  icon: string;       // Icon name from lucide-react
}

/**
 * Conversation context maintained across messages.
 */
export interface ConversationContext {
  recentProspects: ProspectResult[];  // Prospects discussed in this conversation
  activeICP: ICPResult | null;        // ICP being built/used
  lastIntent: UserIntent | null;      // Previous classified intent
  lastPersona: AgentPersona | null;   // Previous agent persona
  userPreferences: {                   // Learned from conversation
    industries?: string[];
    locations?: string[];
    companySizes?: string[];
    focusArea?: string;
  };
}

/**
 * The request body for the agent chat API.
 */
export interface AgentChatRequest {
  message: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  context?: ConversationContext;
  forceIntent?: UserIntent;   // Override intent classification
}

// ============================================================
// Persona Metadata (for UI display)
// ============================================================

export const PERSONA_META: Record<AgentPersona, {
  name: string;
  emoji: string;
  description: string;
  color: string;
  capabilities: string[];
}> = {
  scout: {
    name: 'Scout',
    emoji: '🔍',
    description: 'Company Research Specialist',
    color: 'emerald',
    capabilities: ['Company discovery', 'Deep enrichment', 'Competitive intelligence', 'Web research'],
  },
  hound: {
    name: 'Hound',
    emoji: '🐕',
    description: 'People & Contact Finder',
    color: 'cyan',
    capabilities: ['Person research', 'Contact discovery', 'LinkedIn profiling', 'Email finding'],
  },
  analyst: {
    name: 'Analyst',
    emoji: '📊',
    description: 'Market & Industry Analyst',
    color: 'violet',
    capabilities: ['Market analysis', 'Trend identification', 'Competitive landscape', 'Industry research'],
  },
  architect: {
    name: 'Architect',
    emoji: '🏗️',
    description: 'ICP Builder & Strategist',
    color: 'amber',
    capabilities: ['ICP creation', 'Profile refinement', 'Scoring criteria', 'Target definition'],
  },
  judge: {
    name: 'Judge',
    emoji: '⚖️',
    description: 'Lead Qualification Expert',
    color: 'rose',
    capabilities: ['Lead scoring', 'ICP matching', 'Intent analysis', 'Priority ranking'],
  },
  scribe: {
    name: 'Scribe',
    emoji: '✍️',
    description: 'Outreach & Messaging Expert',
    color: 'sky',
    capabilities: ['Email composition', 'LinkedIn messages', 'Personalization', 'CTA optimization'],
  },
  navigator: {
    name: 'Navigator',
    emoji: '🧭',
    description: 'Strategy & Guidance Agent',
    color: 'indigo',
    capabilities: ['Query clarification', 'Strategy guidance', 'Multi-step planning', 'Pipeline coaching'],
  },
};
