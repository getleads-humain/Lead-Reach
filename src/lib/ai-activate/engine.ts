/**
 * AI Activation Engine — LeadReach AI
 * ====================================
 *
 * Central library that powers AI features across EVERY tool on the platform.
 * Each domain (leads, emails, messaging, setters, campaigns, reports, analytics,
 * outreach, abm, bookings, billing, revenue, settings) has its own AI function
 * that uses the shared callLLM() infrastructure with domain-specific prompts.
 *
 * Design principles:
 * 1. Every function is self-contained — caller passes data, gets back structured AI output
 * 2. Prompts are domain-specific and tuned for the task
 * 3. All functions gracefully degrade — if LLM fails, return null (caller decides fallback)
 * 4. JSON output is preferred for structured data; plain text for narrative content
 */

import { callLLM, callLLMForJSON, type ThinkingBudget } from '@/lib/llm';

// ============================================================
// Types
// ============================================================

export interface LeadContext {
  name?: string;
  company?: string;
  title?: string;
  industry?: string;
  stage?: string;
  notes?: string;
  email?: string;
  phone?: string;
  website?: string;
  lastContactDate?: string;
  responseCount?: number;
  customKpis?: Record<string, unknown>;
}

export interface EmailContext {
  recipientName?: string;
  recipientCompany?: string;
  recipientTitle?: string;
  senderName?: string;
  senderCompany?: string;
  previousEmails?: Array<{ from: string; body: string; date: string }>;
  emailType?: 'cold_outreach' | 'follow_up' | 'meeting_request' | 'proposal' | 're_engagement' | 'thank_you';
  goal?: string;
  keyPoints?: string[];
  tone?: 'professional' | 'friendly' | 'casual' | 'urgent' | 'persuasive';
}

export interface CampaignContext {
  name?: string;
  audience?: string;
  product?: string;
  goal?: string;
  channel?: string;
  duration?: string;
  budget?: string;
  previousResults?: { opens?: number; clicks?: number; replies?: number; meetings?: number };
}

export interface AnalyticsContext {
  metrics: Record<string, number | string>;
  period?: string;
  comparison?: 'wow' | 'mom' | 'yoy';
  previousMetrics?: Record<string, number | string>;
  goals?: Record<string, number>;
}

export interface AIResult<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  modelUsed?: string;
}

// ============================================================
// Internal helpers
// ============================================================

function safeJsonCall<T>(
  prompt: string,
  systemPrompt: string,
  fallback: T,
  budget: ThinkingBudget = 'standard'
): Promise<AIResult<T>> {
  return callLLMForJSON<T>({
    systemPrompt,
    userPrompt: prompt,
    thinkingBudget: budget,
    fallback,
  })
    .then((data) => ({ success: true, data: data as T, modelUsed: 'glm-4.6' }))
    .catch((error) => ({
      success: false,
      error: error instanceof Error ? error.message : 'AI call failed',
    }));
}

function safeTextCall(
  prompt: string,
  systemPrompt: string,
  budget: ThinkingBudget = 'standard'
): Promise<AIResult<string>> {
  return callLLM({
    systemPrompt,
    userPrompt: prompt,
    thinkingBudget: budget,
  })
    .then((text) => ({ success: true, data: text ?? '', modelUsed: 'glm-4.6' }))
    .catch((error) => ({
      success: false,
      error: error instanceof Error ? error.message : 'AI call failed',
    }));
}

// ============================================================
// LEAD AI — scoring, enrichment, recommendations
// ============================================================

export async function aiScoreLead(lead: LeadContext): Promise<AIResult<{
  score: number;
  tier: 'A' | 'B' | 'C' | 'D';
  reasoning: string;
  signals: string[];
  nextBestAction: string;
}>> {
  const systemPrompt = `You are an expert B2B sales analyst. Score leads 0-100 based on firmographic fit, engagement signals, and buying intent. Always return valid JSON.`;
  const prompt = `Score this lead and recommend the next best action:

Lead:
${JSON.stringify(lead, null, 2)}

Return JSON with:
- score: 0-100 (higher = better fit + intent)
- tier: A (80+), B (60-79), C (40-59), D (<40)
- reasoning: 1-2 sentence explanation
- signals: array of 3-5 specific signals that informed the score
- nextBestAction: single concrete next step (e.g., "Send personalized case study about X")`;

  return safeJsonCall(prompt, systemPrompt, {
    score: 50,
    tier: 'C',
    reasoning: 'AI scoring unavailable — fallback score applied',
    signals: [],
    nextBestAction: 'Manual review recommended',
  });
}

export async function aiEnrichLead(lead: LeadContext): Promise<AIResult<{
  inferredIndustry: string;
  inferredCompanySize: string;
  inferredBudget: string;
  inferredTimeline: string;
  inferredAuthority: string;
  inferredNeed: string;
  suggestedApproach: string;
  talkingPoints: string[];
}>> {
  const systemPrompt = `You are a B2B research analyst. Infer missing lead attributes from available context. Always return valid JSON.`;
  const prompt = `Enrich this lead profile with inferred BANT attributes and talking points:

Lead:
${JSON.stringify(lead, null, 2)}

Return JSON with:
- inferredIndustry: best guess industry
- inferredCompanySize: 'startup' | 'smb' | 'mid-market' | 'enterprise'
- inferredBudget: 'low' | 'medium' | 'high' | 'unknown'
- inferredTimeline: 'immediate' | 'quarter' | '6months' | 'exploratory'
- inferredAuthority: 'decision-maker' | 'influencer' | 'end-user' | 'unknown'
- inferredNeed: 1-sentence pain point hypothesis
- suggestedApproach: 1-sentence outreach approach
- talkingPoints: 3-5 specific conversation hooks`;

  return safeJsonCall(prompt, systemPrompt, {
    inferredIndustry: 'Unknown',
    inferredCompanySize: 'unknown',
    inferredBudget: 'unknown',
    inferredTimeline: 'unknown',
    inferredAuthority: 'unknown',
    inferredNeed: 'Unable to infer — manual review needed',
    suggestedApproach: 'Direct discovery call',
    talkingPoints: [],
  });
}

export async function aiRecommendNextAction(lead: LeadContext): Promise<AIResult<{
  action: string;
  channel: string;
  timing: string;
  message: string;
  rationale: string;
}>> {
  const systemPrompt = `You are a sales cadence expert. Recommend the single best next action to move a lead forward. Always return valid JSON.`;
  const prompt = `Given this lead, what's the single highest-leverage next action?

Lead:
${JSON.stringify(lead, null, 2)}

Return JSON with:
- action: short label (e.g., "Send case study", "Book discovery call")
- channel: 'email' | 'linkedin' | 'phone' | 'sms' | 'in-person'
- timing: 'today' | 'this-week' | 'next-week' or specific time
- message: 2-3 sentence suggested message (ready to send)
- rationale: 1 sentence on why this is the right move now`;

  return safeJsonCall(prompt, systemPrompt, {
    action: 'Follow up',
    channel: 'email',
    timing: 'today',
    message: '',
    rationale: 'Default action when AI unavailable',
  });
}

// ============================================================
// EMAIL AI — compose, reply, subject lines, optimize
// ============================================================

export async function aiComposeEmail(ctx: EmailContext): Promise<AIResult<{
  subject: string;
  body: string;
  previewText: string;
  cta: string;
}>> {
  const systemPrompt = `You are an expert B2B email copywriter. Write concise, personalized, high-converting emails. Always return valid JSON.`;
  const prompt = `Compose a ${ctx.emailType || 'cold_outreach'} email.

Context:
${JSON.stringify(ctx, null, 2)}

Rules:
- Subject line under 60 chars, no clickbait
- Body under 150 words, scannable (short paragraphs)
- Personalized to recipient (use name/company)
- One clear CTA
- Tone: ${ctx.tone || 'professional'}
- No emojis unless requested

Return JSON with:
- subject: email subject line
- body: full email body (plain text, with proper salutation/sign-off)
- previewText: 35-50 char preview (first line of body)
- cta: the single call-to-action phrase used`;

  return safeJsonCall(prompt, systemPrompt, {
    subject: '',
    body: '',
    previewText: '',
    cta: '',
  });
}

export async function aiReplyEmail(
  receivedEmail: string,
  ctx: EmailContext
): Promise<AIResult<{
  subject: string;
  body: string;
  intent: string;
  suggestedAction: string;
}>> {
  const systemPrompt = `You are an expert sales SDR. Draft a thoughtful reply that advances the conversation. Always return valid JSON.`;
  const prompt = `Draft a reply to this email:

RECEIVED EMAIL:
${receivedEmail}

CONTEXT:
${JSON.stringify(ctx, null, 2)}

Return JSON with:
- subject: reply subject line (keep "Re:" if appropriate)
- body: reply body under 120 words
- intent: detected intent in received email ('interested' | 'not_now' | 'objection' | 'question' | 'meeting_request' | 'unsubscribe' | 'other')
- suggestedAction: what the rep should do next (e.g., "Book 30-min discovery call")`;

  return safeJsonCall(prompt, systemPrompt, {
    subject: 'Re: ...',
    body: '',
    intent: 'other',
    suggestedAction: 'Manual review',
  });
}

export async function aiOptimizeSubjectLine(subject: string, audience?: string): Promise<AIResult<{
  optimized: string;
  alternatives: string[];
  reasoning: string;
}>> {
  const systemPrompt = `You are an email deliverability and copy expert. Optimize subject lines for opens. Always return valid JSON.`;
  const prompt = `Optimize this subject line for higher open rates.

Original: "${subject}"
Audience: ${audience || 'B2B professionals'}

Return JSON with:
- optimized: best version (under 60 chars)
- alternatives: 4 more variations (different angles)
- reasoning: 1 sentence on why the optimized version will perform better`;

  return safeJsonCall(prompt, systemPrompt, {
    optimized: subject,
    alternatives: [],
    reasoning: 'Optimization unavailable',
  });
}

// ============================================================
// MESSAGING AI — chat replies, conversation summaries
// ============================================================

export async function aiSuggestReply(
  conversation: Array<{ role: 'lead' | 'rep'; text: string; timestamp: string }>,
  channel: string
): Promise<AIResult<{
  suggestedReply: string;
  tone: string;
  alternativeReplies: string[];
  escalationNeeded: boolean;
}>> {
  const systemPrompt = `You are a sales conversation expert. Suggest the best next reply in a live conversation. Always return valid JSON.`;
  const prompt = `Suggest the next reply in this ${channel} conversation:

${conversation.map(m => `[${m.timestamp}] ${m.role.toUpperCase()}: ${m.text}`).join('\n')}

Return JSON with:
- suggestedReply: best next message from rep (under 60 words)
- tone: 'consultative' | 'direct' | 'empathetic' | 'enthusiastic'
- alternativeReplies: 2 alternative angles
- escalationNeeded: true if a human manager should step in`;

  return safeJsonCall(prompt, systemPrompt, {
    suggestedReply: '',
    tone: 'consultative',
    alternativeReplies: [],
    escalationNeeded: false,
  });
}

export async function aiSummarizeConversation(
  conversation: Array<{ role: 'lead' | 'rep'; text: string; timestamp: string }>
): Promise<AIResult<{
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  nextStep: string;
}>> {
  const systemPrompt = `You are a sales analyst. Summarize conversations concisely for CRM notes. Always return valid JSON.`;
  const prompt = `Summarize this conversation:

${conversation.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}

Return JSON with:
- summary: 2-3 sentence executive summary
- keyPoints: 3-5 bullet points of what was discussed
- actionItems: concrete next steps for the rep
- sentiment: overall lead sentiment
- nextStep: single highest-priority next action`;

  return safeJsonCall(prompt, systemPrompt, {
    summary: '',
    keyPoints: [],
    actionItems: [],
    sentiment: 'neutral',
    nextStep: '',
  });
}

// ============================================================
// SETTER AI — call coaching, qualification, objection handling
// ============================================================

export async function aiCoachSetter(
  callTranscript: string,
  setterName: string
): Promise<AIResult<{
  score: number;
  strengths: string[];
  improvementAreas: string[];
  objectionHandling: { objection: string; howHandled: string; betterApproach: string }[];
  qualifyingQuestionsAsked: string[];
  missedQualifyingQuestions: string[];
  closingTechnique: string;
  overallFeedback: string;
}>> {
  const systemPrompt = `You are a sales coaching expert for SDRs/setters. Analyze call transcripts and provide specific, actionable feedback. Always return valid JSON.`;
  const prompt = `Coach setter "${setterName}" based on this call transcript:

${callTranscript}

Return JSON with:
- score: 0-100 call quality score
- strengths: 3-4 things the setter did well
- improvementAreas: 3-4 specific areas to improve
- objectionHandling: array of {objection, howHandled, betterApproach}
- qualifyingQuestionsAsked: BANT-style questions the setter asked
- missedQualifyingQuestions: important qualification questions that were NOT asked
- closingTechnique: how the setter tried to close (or why they didn't)
- overallFeedback: 2-sentence summary`;

  return safeJsonCall(prompt, systemPrompt, {
    score: 50,
    strengths: [],
    improvementAreas: [],
    objectionHandling: [],
    qualifyingQuestionsAsked: [],
    missedQualifyingQuestions: [],
    closingTechnique: '',
    overallFeedback: 'Coaching unavailable',
  }, 'deep');
}

export async function aiGenerateQualifyingRules(productContext: string): Promise<AIResult<{
  mustHaves: string[];
  niceToHaves: string[];
  disqualifiers: string[];
  budgetRange: string;
  suggestedQuestions: string[];
}>> {
  const systemPrompt = `You are a B2B qualification framework expert. Design ICP-aware qualification rules. Always return valid JSON.`;
  const prompt = `Design qualification rules for setters taking calls about:

${productContext}

Return JSON with:
- mustHaves: 3-5 non-negotiable qualifying criteria
- niceToHaves: 3-5 criteria that boost deal quality
- disqualifiers: 3-5 red flags that should end the call
- budgetRange: suggested minimum budget threshold with rationale
- suggestedQuestions: 5-7 qualifying questions the setter should ask`;

  return safeJsonCall(prompt, systemPrompt, {
    mustHaves: [],
    niceToHaves: [],
    disqualifiers: [],
    budgetRange: '',
    suggestedQuestions: [],
  });
}

// ============================================================
// CAMPAIGN AI — generate, optimize, sequence
// ============================================================

export async function aiGenerateCampaign(ctx: CampaignContext): Promise<AIResult<{
  name: string;
  goal: string;
  targetAudience: string;
  messaging: string;
  sequenceSteps: { day: number; channel: string; content: string; goal: string }[];
  successMetrics: string[];
  estimatedResults: { reach: string; expectedReplies: string; expectedMeetings: string };
}>> {
  const systemPrompt = `You are a B2B campaign strategist. Design multi-touch campaigns with concrete sequences. Always return valid JSON.`;
  const prompt = `Design a ${ctx.channel || 'multi-channel'} campaign:

Context:
${JSON.stringify(ctx, null, 2)}

Return JSON with:
- name: campaign name (memorable)
- goal: 1-sentence campaign goal
- targetAudience: precise ICP description
- messaging: core value prop in 1 sentence
- sequenceSteps: 5-7 step sequence (each: day offset, channel, content summary, goal)
- successMetrics: 3-5 KPIs to track
- estimatedResults: rough reach/replies/meetings estimates`;

  return safeJsonCall(prompt, systemPrompt, {
    name: ctx.name || 'New Campaign',
    goal: '',
    targetAudience: '',
    messaging: '',
    sequenceSteps: [],
    successMetrics: [],
    estimatedResults: { reach: '', expectedReplies: '', expectedMeetings: '' },
  }, 'deep');
}

export async function aiOptimizeCampaign(
  performance: { opens?: number; clicks?: number; replies?: number; meetings?: number; sent?: number }
): Promise<AIResult<{
  diagnosis: string;
  optimization: string[];
  subjectLineSuggestions: string[];
  timingSuggestions: string[];
  audienceRefinements: string[];
  projectedLift: string;
}>> {
  const systemPrompt = `You are a campaign optimization expert. Diagnose performance issues and recommend fixes. Always return valid JSON.`;
  const prompt = `Diagnose and optimize this campaign:

Performance: ${JSON.stringify(performance, null, 2)}

Return JSON with:
- diagnosis: 2-3 sentence root cause analysis
- optimization: 3-5 concrete fixes ordered by impact
- subjectLineSuggestions: 3 subject line variants
- timingSuggestions: best send times/days
- audienceRefinements: how to narrow or expand the ICP
- projectedLift: expected improvement after fixes (e.g., "+35% reply rate")`;

  return safeJsonCall(prompt, systemPrompt, {
    diagnosis: '',
    optimization: [],
    subjectLineSuggestions: [],
    timingSuggestions: [],
    audienceRefinements: [],
    projectedLift: '',
  });
}

// ============================================================
// REPORTS AI — executive summaries, insights
// ============================================================

export async function aiGenerateReportSummary(
  data: Record<string, unknown>,
  reportType: string
): Promise<AIResult<{
  executiveSummary: string;
  keyFindings: string[];
  trends: string[];
  risks: string[];
  opportunities: string[];
  recommendations: string[];
}>> {
  const systemPrompt = `You are a CRO-grade analyst. Generate executive-level summaries of business data. Always return valid JSON.`;
  const prompt = `Generate an executive summary for a ${reportType} report.

Data:
${JSON.stringify(data, null, 2)}

Return JSON with:
- executiveSummary: 3-4 sentence narrative summary
- keyFindings: 3-5 most important data-backed findings
- trends: 2-4 trends worth watching
- risks: 2-3 risks requiring attention
- opportunities: 2-3 actionable opportunities
- recommendations: 3-5 prioritized recommendations`;

  return safeJsonCall(prompt, systemPrompt, {
    executiveSummary: '',
    keyFindings: [],
    trends: [],
    risks: [],
    opportunities: [],
    recommendations: [],
  }, 'deep');
}

// ============================================================
// ANALYTICS AI — commentary, anomaly detection, forecasting
// ============================================================

export async function aiAnnotateAnalytics(ctx: AnalyticsContext): Promise<AIResult<{
  headline: string;
  commentary: string[];
  anomalies: string[];
  forecast: string;
  benchmarkComparison: string;
  suggestedActions: string[];
}>> {
  const systemPrompt = `You are a data analyst. Translate raw metrics into business-readable insights. Always return valid JSON.`;
  const prompt = `Annotate these analytics with insights:

${JSON.stringify(ctx, null, 2)}

Return JSON with:
- headline: 1-sentence takeaway (e.g., "Pipeline velocity up 23% WoW despite reply rate dip")
- commentary: 3-5 specific observations tied to numbers
- anomalies: 2-3 unusual patterns worth investigating
- forecast: 1-sentence prediction for next period
- benchmarkComparison: how these numbers compare to typical B2B SaaS benchmarks
- suggestedActions: 3-5 concrete actions ordered by impact`;

  return safeJsonCall(prompt, systemPrompt, {
    headline: '',
    commentary: [],
    anomalies: [],
    forecast: '',
    benchmarkComparison: '',
    suggestedActions: [],
  });
}

export async function aiForecastRevenue(
  historicalData: Array<{ period: string; revenue: number; deals: number }>,
  quarters: number = 2
): Promise<AIResult<{
  forecast: Array<{ period: string; projectedRevenue: number; confidence: 'low' | 'medium' | 'high' }>;
  assumptions: string[];
  risks: string[];
  upsideScenarios: string[];
}>> {
  const systemPrompt = `You are a revenue forecasting expert. Provide calibrated, honest forecasts. Always return valid JSON.`;
  const prompt = `Forecast revenue for the next ${quarters} quarters based on:

${JSON.stringify(historicalData, null, 2)}

Return JSON with:
- forecast: array of {period, projectedRevenue, confidence} for next ${quarters} quarters
- assumptions: 3-5 assumptions driving the forecast
- risks: 2-4 downside risks
- upsideScenarios: 2-3 things that could beat the forecast`;

  return safeJsonCall(prompt, systemPrompt, {
    forecast: [],
    assumptions: [],
    risks: [],
    upsideScenarios: [],
  }, 'deep');
}

// ============================================================
// OUTREACH AI — sequence generation, personalization
// ============================================================

export async function aiGenerateOutreachSequence(
  lead: LeadContext,
  goal: string,
  channels: string[] = ['email', 'linkedin', 'phone']
): Promise<AIResult<{
  sequence: Array<{
    step: number;
    day: number;
    channel: string;
    subject: string;
    body: string;
    goal: string;
  }>;
  personalizationHooks: string[];
  exitCriteria: string;
}>> {
  const systemPrompt = `You are a B2B outreach cadence expert. Design personalized multi-touch sequences. Always return valid JSON.`;
  const prompt = `Design a ${channels.length}-touch outreach sequence for this lead:

Lead: ${JSON.stringify(lead, null, 2)}
Goal: ${goal}
Channels: ${channels.join(', ')}

Return JSON with:
- sequence: 5-7 step sequence (each: step number, day offset from start, channel, subject, body, step goal)
- personalizationHooks: 3-5 specific personalization angles for this lead
- exitCriteria: when to stop the sequence (positive reply, meeting booked, etc.)`;

  return safeJsonCall(prompt, systemPrompt, {
    sequence: [],
    personalizationHooks: [],
    exitCriteria: '',
  }, 'deep');
}

// ============================================================
// ABM AI — account selection, account plans
// ============================================================

export async function aiScoreAccount(account: {
  name: string;
  industry?: string;
  size?: string;
  revenue?: string;
  techStack?: string[];
  recentNews?: string;
  currentVendor?: string;
}): Promise<AIResult<{
  fitScore: number;
  intentScore: number;
  totalScore: number;
  reasoning: string;
  recommendedChannels: string[];
  suggestedAngles: string[];
  estimatedDealSize: string;
}>> {
  const systemPrompt = `You are an ABM strategist. Score accounts on fit + intent and recommend engagement strategy. Always return valid JSON.`;
  const prompt = `Score this account for ABM targeting:

${JSON.stringify(account, null, 2)}

Return JSON with:
- fitScore: 0-100 (how well they match ICP)
- intentScore: 0-100 (signals of active buying intent)
- totalScore: weighted average (fit 60%, intent 40%)
- reasoning: 2-sentence explanation
- recommendedChannels: 2-3 best channels to engage this account
- suggestedAngles: 2-3 messaging angles likely to resonate
- estimatedDealSize: rough ACV estimate with reasoning`;

  return safeJsonCall(prompt, systemPrompt, {
    fitScore: 50,
    intentScore: 50,
    totalScore: 50,
    reasoning: '',
    recommendedChannels: [],
    suggestedAngles: [],
    estimatedDealSize: '',
  });
}

// ============================================================
// BOOKING AI — optimal times, prep briefs
// ============================================================

export async function aiGenerateMeetingBrief(
  lead: LeadContext,
  meetingType: string,
  previousConversations?: string
): Promise<AIResult<{
  brief: string;
  agenda: string[];
  discoveryQuestions: string[];
  demoFocus: string[];
  expectedObjections: { objection: string; response: string }[];
  closingGoal: string;
}>> {
  const systemPrompt = `You are a sales engineer. Prepare concise meeting briefs that reps can read in 2 minutes. Always return valid JSON.`;
  const prompt = `Prepare a meeting brief for:

Lead: ${JSON.stringify(lead, null, 2)}
Meeting Type: ${meetingType}
Previous Conversations: ${previousConversations || 'None'}

Return JSON with:
- brief: 3-4 sentence summary of who they are and what to focus on
- agenda: 4-6 item agenda with time allocations
- discoveryQuestions: 4-5 questions to uncover pain
- demoFocus: 2-3 features to highlight based on their context
- expectedObjections: 2-3 likely objections with prepared responses
- closingGoal: 1-sentence goal for what to walk away with`;

  return safeJsonCall(prompt, systemPrompt, {
    brief: '',
    agenda: [],
    discoveryQuestions: [],
    demoFocus: [],
    expectedObjections: [],
    closingGoal: '',
  });
}

// ============================================================
// SETTINGS AI — optimization recommendations
// ============================================================

export async function aiRecommendSettingsOptimizations(
  currentSettings: Record<string, unknown>
): Promise<AIResult<{
  recommendations: Array<{
    area: string;
    issue: string;
    recommendation: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
  }>;
  quickWins: string[];
  strategicChanges: string[];
}>> {
  const systemPrompt = `You are a RevOps consultant. Recommend specific, high-impact configuration improvements. Always return valid JSON.`;
  const prompt = `Recommend optimizations for these LeadReach settings:

${JSON.stringify(currentSettings, null, 2)}

Return JSON with:
- recommendations: array of {area, issue, recommendation, impact, effort} (4-6 items)
- quickWins: 2-3 changes that are low-effort, high-impact
- strategicChanges: 2-3 changes requiring more planning but worth it`;

  return safeJsonCall(prompt, systemPrompt, {
    recommendations: [],
    quickWins: [],
    strategicChanges: [],
  });
}

// ============================================================
// BILLING AI — cost insights
// ============================================================

export async function aiAnalyzeBillingUsage(
  usage: { plan: string; seats?: number; apiCalls?: number; leadsUsed?: number; leadsLimit?: number; aiCreditsUsed?: number; aiCreditsLimit?: number }
): Promise<AIResult<{
  summary: string;
  efficiency: string;
  recommendedPlan: string;
  costOptimizations: string[];
  projectedSavings: string;
}>> {
  const systemPrompt = `You are a SaaS billing analyst. Help customers optimize their plan and usage. Always return valid JSON.`;
  const prompt = `Analyze this customer's billing usage and recommend optimizations:

${JSON.stringify(usage, null, 2)}

Return JSON with:
- summary: 2-sentence overview of usage patterns
- efficiency: 1-sentence efficiency rating (e.g., "78% efficient — underutilizing seats")
- recommendedPlan: best plan for their usage (downgrade, keep, or upgrade with reasoning)
- costOptimizations: 2-3 concrete ways to reduce spend
- projectedSavings: estimated monthly savings if optimizations applied`;

  return safeJsonCall(prompt, systemPrompt, {
    summary: '',
    efficiency: '',
    recommendedPlan: '',
    costOptimizations: [],
    projectedSavings: '',
  });
}

// ============================================================
// PIPELINE AI — deal health, forecasting, coaching
// ============================================================

export async function aiAnalyzeDeal(deal: {
  name: string;
  value: number;
  stage: string;
  age: number;
  lastActivity: string;
  nextStep: string;
  competitors?: string[];
  decisionMakers?: string[];
}): Promise<AIResult<{
  healthScore: number;
  atRiskReasons: string[];
  recommendedActions: string[];
  forecastedClose: string;
  winProbability: number;
  coachingTips: string[];
}>> {
  const systemPrompt = `You are a sales manager reviewing pipeline deals. Assess deal health honestly. Always return valid JSON.`;
  const prompt = `Analyze this deal's health:

${JSON.stringify(deal, null, 2)}

Return JSON with:
- healthScore: 0-100 (100 = healthy, fast-moving deal)
- atRiskReasons: 2-4 specific risks (empty array if healthy)
- recommendedActions: 3-5 concrete actions to move deal forward
- forecastedClose: estimated close date or "delayed" if at risk
- winProbability: 0-100 percent
- coachingTips: 2-3 tips for the rep`;

  return safeJsonCall(prompt, systemPrompt, {
    healthScore: 50,
    atRiskReasons: [],
    recommendedActions: [],
    forecastedClose: '',
    winProbability: 50,
    coachingTips: [],
  });
}

// ============================================================
// ICP AI — refine ideal customer profile
// ============================================================

export async function aiRefineICP(
  currentICP: { industry?: string; size?: string; geography?: string; titles?: string[]; painPoints?: string[] },
  customerData: { totalCustomers: number; topCustomers: string[]; churnedCustomers: string[]; averageACV?: number }
): Promise<AIResult<{
  refinedICP: string;
  expansionOpportunities: string[];
  contractionRisks: string[];
  newSegmentsToExplore: string[];
  messagingImplications: string[];
}>> {
  const systemPrompt = `You are an ICP strategist. Use customer data to refine the ideal customer profile. Always return valid JSON.`;
  const prompt = `Refine this ICP based on customer data:

Current ICP: ${JSON.stringify(currentICP, null, 2)}
Customer Data: ${JSON.stringify(customerData, null, 2)}

Return JSON with:
- refinedICP: 2-3 sentence refined ICP definition
- expansionOpportunities: 2-3 segments adjacent to current ICP worth exploring
- contractionRisks: 1-2 segments to avoid (low fit or high churn)
- newSegmentsToExplore: 1-2 new ICP hypotheses to test
- messagingImplications: 2-3 messaging shifts implied by the refined ICP`;

  return safeJsonCall(prompt, systemPrompt, {
    refinedICP: '',
    expansionOpportunities: [],
    contractionRisks: [],
    newSegmentsToExplore: [],
    messagingImplications: [],
  });
}

// ============================================================
// GENERIC AI — for any domain that needs a quick LLM call
// ============================================================

export async function aiGeneric<T = string>(
  task: string,
  input: unknown,
  outputSchema: string,
  systemPrompt?: string
): Promise<AIResult<T>> {
  const fullSystemPrompt = systemPrompt || `You are an expert assistant. Always return valid JSON matching the requested schema.`;
  const prompt = `Task: ${task}

Input:
${JSON.stringify(input, null, 2)}

Return JSON with this schema:
${outputSchema}`;

  return safeJsonCall<T>(prompt, fullSystemPrompt, {} as T);
}

export async function aiGenericText(
  task: string,
  input: unknown,
  systemPrompt?: string
): Promise<AIResult<string>> {
  const fullSystemPrompt = systemPrompt || `You are an expert assistant. Provide a clear, helpful response.`;
  const prompt = `${task}

Input:
${JSON.stringify(input, null, 2)}`;

  return safeTextCall(prompt, fullSystemPrompt);
}

// ============================================================
// Health check
// ============================================================

export async function aiActivationHealth(): Promise<{ ready: boolean; capabilities: string[] }> {
  const capabilities = [
    'lead-scoring',
    'lead-enrichment',
    'lead-next-action',
    'email-compose',
    'email-reply',
    'email-subject-optimize',
    'messaging-suggest-reply',
    'messaging-summarize',
    'setter-coach',
    'setter-qualifying-rules',
    'campaign-generate',
    'campaign-optimize',
    'report-summary',
    'analytics-annotate',
    'analytics-forecast',
    'outreach-sequence',
    'abm-score',
    'booking-brief',
    'settings-recommend',
    'billing-analyze',
    'pipeline-analyze',
    'icp-refine',
    'generic-json',
    'generic-text',
  ];
  return { ready: true, capabilities };
}
