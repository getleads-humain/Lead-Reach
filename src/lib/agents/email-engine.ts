/**
 * Email Engagement Engine — LeadReach
 * =====================================
 *
 * Comprehensive email engagement engine providing:
 * - AI-powered email template generation & personalization
 * - Email sending with tracking metadata
 * - Open / click / reply / bounce tracking via webhooks & pixel
 * - Email sequences with conditional advancement
 * - Engagement scoring & analytics
 * - Bounce & complaint handling with suppression management
 *
 * Uses centralized callLLMForJSON for all AI-powered features.
 * Falls back to comprehensive static defaults when LLM is unavailable.
 */

import { callLLMForJSON } from '@/lib/llm';

// ============================================================
// Types
// ============================================================

export type EmailTemplateCategory =
  | 'cold_outreach'
  | 'follow_up'
  | 'meeting_request'
  | 'proposal'
  | 'break_up'
  | 'nurture'
  | 'referral';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: EmailTemplateCategory;
  variables: string[];
  createdAt: string;
}

export interface EmailSequenceStep {
  stepNumber: number;
  templateId: string;
  delayDays: number;
  channel: 'email' | 'linkedin' | 'phone';
  conditions: EmailStepCondition[];
}

export interface EmailStepCondition {
  type: 'opened' | 'clicked' | 'replied' | 'bounced' | 'no_action';
  action: 'skip' | 'send' | 'pause' | 'advance';
  waitHours?: number;
}

export interface EmailSequence {
  id: string;
  name: string;
  steps: EmailSequenceStep[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  enrolledCount: number;
  responseRate: number;
  createdAt: string;
  updatedAt: string;
}

export type EmailEventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced';

export interface EmailTrackingEvent {
  id: string;
  emailId: string;
  event: EmailEventType;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface EmailEngagementScore {
  leadId: string;
  score: number; // 0–100
  breakdown: {
    openRate: number;
    clickRate: number;
    replyRate: number;
    bounceRate: number;
    engagementVelocity: number;
  };
  calculatedAt: string;
}

export interface SendEmailParams {
  leadId: string;
  to: string;
  from?: string;
  subject: string;
  body: string;
  htmlBody?: string;
  templateId?: string;
  sequenceId?: string;
  sequenceStep?: number;
  replyTo?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailResult {
  emailId: string;
  status: 'sent' | 'queued' | 'failed';
  trackingPixelUrl: string;
  trackingWebhookUrl: string;
  timestamp: string;
}

export interface EmailAnalytics {
  totalSent: number;
  delivered: number;
  opens: number;
  clicks: number;
  replies: number;
  bounces: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  period: { start: string; end: string };
  campaignId?: string;
}

export interface SequencePerformance {
  sequenceId: string;
  sequenceName: string;
  totalEnrolled: number;
  completedCount: number;
  activeCount: number;
  optOutCount: number;
  overallReplyRate: number;
  overallOpenRate: number;
  stepMetrics: Array<{
    stepNumber: number;
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
  }>;
}

export interface SuppressedEmail {
  email: string;
  reason: 'hard_bounce' | 'complaint' | 'unsubscribe' | 'manual';
  suppressedAt: string;
  details?: string;
}

export interface LeadSequenceEnrollment {
  id: string;
  leadId: string;
  sequenceId: string;
  currentStep: number;
  status: 'active' | 'paused' | 'completed' | 'opted_out';
  enrolledAt: string;
  lastStepAt?: string;
  nextStepAt?: string;
}

// ============================================================
// Constants & Fallback Data
// ============================================================

const TRACKING_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.leadreach.ai';
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend'; // 'resend' | 'sendgrid'

const FALLBACK_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl_cold_outreach_01',
    name: 'Cold Outreach — Observation & Ask',
    subject: 'Quick question about {{company}}',
    body: `Hi {{firstName}},

I noticed {{company}} has been expanding in the {{industry}} space — impressive momentum. I had a specific observation and a quick question. Mind if I share?

Best,
{{senderName}}`,
    category: 'cold_outreach',
    variables: ['firstName', 'company', 'industry', 'senderName'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_follow_up_01',
    name: 'Follow-Up — Value Add',
    subject: 'Re: {{originalSubject}}',
    body: `Hi {{firstName}},

Just bumping this up. I recently came across a case study where a similar company in {{industry}} achieved {{resultMetric}} after addressing {{painPoint}}.

Happy to share the details if it's relevant.

Best,
{{senderName}}`,
    category: 'follow_up',
    variables: ['firstName', 'originalSubject', 'industry', 'resultMetric', 'painPoint', 'senderName'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_meeting_request_01',
    name: 'Meeting Request — Quick Chat',
    subject: '15 min this week, {{firstName}}?',
    body: `Hi {{firstName}},

Based on our conversation about {{topic}}, I think a quick 15-minute chat would be valuable to explore how we can help {{company}} with {{valueProposition}}.

Are you available {{suggestedTime}}?

Best,
{{senderName}}`,
    category: 'meeting_request',
    variables: ['firstName', 'topic', 'company', 'valueProposition', 'suggestedTime', 'senderName'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_proposal_01',
    name: 'Proposal — Custom Solution',
    subject: 'Proposal for {{company}} — {{solutionTitle}}',
    body: `Hi {{firstName}},

Thank you for the conversation about {{company}}'s needs around {{painPoint}}. I've put together a proposal that outlines how we can deliver {{valueProposition}} with an expected impact of {{expectedImpact}}.

Please find the details below. I'd love to walk through this together — are you free {{suggestedTime}}?

Best,
{{senderName}}`,
    category: 'proposal',
    variables: ['firstName', 'company', 'painPoint', 'valueProposition', 'expectedImpact', 'solutionTitle', 'suggestedTime', 'senderName'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_break_up_01',
    name: 'Break-Up — Closing the Loop',
    subject: 'Closing the loop',
    body: `Hi {{firstName}},

I'll assume the timing isn't right. If things change down the road, I'm here — I'm confident we can help {{company}} with {{valueProposition}}.

Best of luck with everything at {{company}}.

Best,
{{senderName}}`,
    category: 'break_up',
    variables: ['firstName', 'company', 'valueProposition', 'senderName'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_nurture_01',
    name: 'Nurture — Industry Insight',
    subject: "Thought you'd find this interesting, {{firstName}}",
    body: `Hi {{firstName}},

I came across this research on {{topic}} that I thought would resonate given {{company}}'s focus on {{focusArea}}.

Key insight: {{keyInsight}}

No action needed — just wanted to share. If you'd like to discuss how this applies to {{company}}, I'm always happy to chat.

Best,
{{senderName}}`,
    category: 'nurture',
    variables: ['firstName', 'company', 'topic', 'focusArea', 'keyInsight', 'senderName'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_referral_01',
    name: 'Referral — Warm Introduction',
    subject: '{{mutualConnection}} suggested we connect',
    body: `Hi {{firstName}},

{{mutualConnection}} suggested I reach out — they mentioned {{company}} might be interested in {{valueProposition}}.

Would you be open to a brief intro call this week?

Best,
{{senderName}}`,
    category: 'referral',
    variables: ['firstName', 'company', 'mutualConnection', 'valueProposition', 'senderName'],
    createdAt: new Date().toISOString(),
  },
];

const FALLBACK_SEQUENCES: EmailSequence[] = [
  {
    id: 'seq_cold_5step',
    name: '5-Step Cold Outreach',
    steps: [
      { stepNumber: 1, templateId: 'tpl_cold_outreach_01', delayDays: 0, channel: 'email', conditions: [] },
      { stepNumber: 2, templateId: 'tpl_follow_up_01', delayDays: 3, channel: 'email', conditions: [{ type: 'no_action', action: 'send' }] },
      { stepNumber: 3, templateId: 'tpl_follow_up_01', delayDays: 5, channel: 'email', conditions: [{ type: 'no_action', action: 'send' }] },
      { stepNumber: 4, templateId: 'tpl_meeting_request_01', delayDays: 7, channel: 'email', conditions: [{ type: 'opened', action: 'send' }] },
      { stepNumber: 5, templateId: 'tpl_break_up_01', delayDays: 10, channel: 'email', conditions: [{ type: 'no_action', action: 'send' }] },
    ],
    status: 'active',
    enrolledCount: 0,
    responseRate: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seq_nurture_6step',
    name: '6-Step Nurture Campaign',
    steps: [
      { stepNumber: 1, templateId: 'tpl_nurture_01', delayDays: 0, channel: 'email', conditions: [] },
      { stepNumber: 2, templateId: 'tpl_nurture_01', delayDays: 7, channel: 'email', conditions: [{ type: 'no_action', action: 'send' }] },
      { stepNumber: 3, templateId: 'tpl_follow_up_01', delayDays: 14, channel: 'email', conditions: [{ type: 'no_action', action: 'send' }] },
      { stepNumber: 4, templateId: 'tpl_nurture_01', delayDays: 14, channel: 'email', conditions: [{ type: 'no_action', action: 'send' }] },
      { stepNumber: 5, templateId: 'tpl_meeting_request_01', delayDays: 10, channel: 'email', conditions: [{ type: 'opened', action: 'send' }] },
      { stepNumber: 6, templateId: 'tpl_break_up_01', delayDays: 14, channel: 'email', conditions: [{ type: 'no_action', action: 'send' }] },
    ],
    status: 'active',
    enrolledCount: 0,
    responseRate: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/** In-memory suppression list — in production this would be in the DB */
let suppressionList: SuppressedEmail[] = [];

// ============================================================
// Helper: Generate unique IDs
// ============================================================

function generateId(prefix: string = 'eml'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  const random2 = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${timestamp}${random}${random2}`;
}

function generateTrackingId(): string {
  return generateId('trk');
}

// ============================================================
// 1. Email Template Engine (AI-Powered)
// ============================================================

/**
 * Generate an email template for a given category using LLM.
 * Falls back to a static template if LLM is unavailable.
 */
export async function generateEmailTemplate(
  category: EmailTemplateCategory,
  context: {
    companyName?: string;
    industry?: string;
    valueProposition?: string;
    painPoints?: string[];
    tone?: 'professional' | 'casual' | 'friendly' | 'assertive';
    targetRole?: string;
    productDescription?: string;
  } = {}
): Promise<EmailTemplate> {
  const categoryDescriptions: Record<EmailTemplateCategory, string> = {
    cold_outreach: 'First-contact email to a prospect who has no prior relationship with the sender.',
    follow_up: 'Follow-up email after an initial outreach or conversation.',
    meeting_request: 'Email requesting a meeting or call with the prospect.',
    proposal: 'Email presenting a proposal or solution to the prospect.',
    break_up: 'Final email in a sequence, gracefully closing the loop when there has been no response.',
    nurture: 'Value-add email sharing insights, resources, or information to build a long-term relationship.',
    referral: 'Email referencing a mutual connection or referral to establish trust quickly.',
  };

  const systemPrompt = `You are an expert B2B email copywriter. Generate a high-converting email template for the given category.

Rules:
- Write compelling, personalized subject lines (under 60 characters)
- Keep body under 150 words
- Use {{variable}} placeholders for personalization (e.g., {{firstName}}, {{company}}, {{industry}})
- End with a clear, low-friction call to action
- Avoid spam trigger words (free, guarantee, no obligation, etc.)
- Make it feel personal, not generic
- Return ONLY valid JSON, no markdown`;

  const userMessage = `CATEGORY: ${category}
DESCRIPTION: ${categoryDescriptions[category]}
${context.companyName ? `COMPANY: ${context.companyName}` : ''}
${context.industry ? `INDUSTRY: ${context.industry}` : ''}
${context.valueProposition ? `VALUE PROPOSITION: ${context.valueProposition}` : ''}
${context.painPoints?.length ? `PAIN POINTS: ${context.painPoints.join(', ')}` : ''}
${context.tone ? `TONE: ${context.tone}` : ''}
${context.targetRole ? `TARGET ROLE: ${context.targetRole}` : ''}
${context.productDescription ? `PRODUCT: ${context.productDescription}` : ''}

Generate a JSON object with this exact structure:
{
  "name": "Template name (descriptive)",
  "subject": "Subject line with {{variables}}",
  "body": "Email body with {{variables}} for personalization",
  "variables": ["firstName", "company", ...all variables used]
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed && parsed.name && parsed.subject && parsed.body) {
      return {
        id: generateId('tpl'),
        name: parsed.name as string,
        subject: parsed.subject as string,
        body: parsed.body as string,
        category,
        variables: Array.isArray(parsed.variables) ? (parsed.variables as string[]) : extractVariables(`${parsed.subject} ${parsed.body}`),
        createdAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.warn('[EmailEngine] generateEmailTemplate LLM failed, using fallback:', error);
  }

  // Fallback: use a matching static template
  const fallback = FALLBACK_TEMPLATES.find(t => t.category === category) || FALLBACK_TEMPLATES[0];
  return {
    ...fallback,
    id: generateId('tpl'),
    name: `${fallback.name} (Auto-generated)`,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Personalize a template with lead-specific data using LLM.
 * Falls back to simple variable substitution if LLM is unavailable.
 */
export async function personalizeTemplate(
  template: EmailTemplate,
  leadData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    company?: string;
    industry?: string;
    title?: string;
    painPoints?: string[];
    recentNews?: string;
    mutualConnection?: string;
    [key: string]: unknown;
  }
): Promise<{ subject: string; body: string }> {
  const systemPrompt = `You are an expert B2B email personalizer. Given a template and lead data, produce a highly personalized email that feels natural and relevant.

Rules:
- Incorporate lead-specific details naturally (not just find-and-replace)
- Reference specific company/industry context where possible
- Keep the same general structure and call-to-action as the template
- Maintain the same tone and intent
- Return ONLY valid JSON, no markdown`;

  const userMessage = `TEMPLATE:
Subject: ${template.subject}
Body: ${template.body}

LEAD DATA:
- Name: ${leadData.firstName || ''} ${leadData.lastName || ''}
- Email: ${leadData.email || ''}
- Company: ${leadData.company || ''}
- Industry: ${leadData.industry || ''}
- Title: ${leadData.title || ''}
- Pain Points: ${leadData.painPoints?.join(', ') || ''}
- Recent News: ${leadData.recentNews || ''}
- Mutual Connection: ${leadData.mutualConnection || ''}
${Object.keys(leadData).filter(k => !['firstName', 'lastName', 'email', 'company', 'industry', 'title', 'painPoints', 'recentNews', 'mutualConnection'].includes(k))
  .map(k => `- ${k}: ${String(leadData[k])}`)
  .join('\n')}

Generate a JSON object:
{
  "subject": "Personalized subject line",
  "body": "Personalized email body"
}`;

  try {
    const parsed = await callLLMForJSON<{ subject: string; body: string }>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed && parsed.subject && parsed.body) {
      return { subject: parsed.subject, body: parsed.body };
    }
  } catch (error) {
    console.warn('[EmailEngine] personalizeTemplate LLM failed, using simple substitution:', error);
  }

  // Fallback: simple variable substitution
  let subject = template.subject;
  let body = template.body;

  const varMap: Record<string, string> = {
    firstName: leadData.firstName || 'there',
    lastName: leadData.lastName || '',
    company: leadData.company || 'your company',
    industry: leadData.industry || 'your industry',
    title: leadData.title || '',
    painPoint: leadData.painPoints?.[0] || 'your challenges',
    mutualConnection: leadData.mutualConnection || 'our mutual contact',
  };

  // Merge any additional lead data keys
  for (const [key, value] of Object.entries(leadData)) {
    if (typeof value === 'string') {
      varMap[key] = value;
    }
  }

  for (const [key, value] of Object.entries(varMap)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  return { subject, body };
}

/**
 * Extract {{variable}} placeholders from a string.
 */
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  const unique = new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')));
  return Array.from(unique);
}

/**
 * Get saved email templates from the database.
 * Falls back to static templates if DB is unavailable.
 */
export async function getEmailTemplates(category?: EmailTemplateCategory): Promise<EmailTemplate[]> {
  try {
    const { db } = await import('@/lib/db');

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category;
    }

    const rows = await db.outreach.findMany({
      where: { ...where, type: 'email_template' },
      orderBy: { createdAt: 'desc' },
    });

    if (rows && rows.length > 0) {
      return rows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        name: (row.subject as string) || 'Untitled Template',
        subject: (row.subject as string) || '',
        body: (row.body as string) || '',
        category: (row.channel as EmailTemplateCategory) || 'cold_outreach',
        variables: Array.isArray(row.metadata) ? row.metadata as string[] : extractVariables(`${row.subject || ''} ${row.body || ''}`),
        createdAt: (row.createdAt as string) || new Date().toISOString(),
      }));
    }
  } catch (error) {
    console.warn('[EmailEngine] getEmailTemplates DB failed, using fallbacks:', error);
  }

  if (category) {
    return FALLBACK_TEMPLATES.filter(t => t.category === category);
  }
  return [...FALLBACK_TEMPLATES];
}

/**
 * Save an email template to the database.
 */
export async function saveEmailTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt'>): Promise<EmailTemplate> {
  const newTemplate: EmailTemplate = {
    id: generateId('tpl'),
    ...template,
    createdAt: new Date().toISOString(),
  };

  try {
    const { db } = await import('@/lib/db');

    await db.outreach.create({
      data: {
        channel: template.category,
        type: 'email_template',
        subject: template.subject,
        body: template.body,
        status: 'draft',
        metadata: template.variables,
      },
    });
  } catch (error) {
    console.warn('[EmailEngine] saveEmailTemplate DB failed, template kept in memory only:', error);
  }

  return newTemplate;
}

// ============================================================
// 2. Email Sending Engine
// ============================================================

/**
 * Send an email. Currently stores as "sent" in the Outreach table with tracking metadata.
 * When Resend/SendGrid is configured, this will integrate with the actual provider.
 *
 * Includes webhook URL generation for tracking.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const emailId = generateId('eml');
  const trackingId = generateTrackingId();
  const trackingPixelUrl = `${TRACKING_BASE_URL}/api/email/track?event=opened&eid=${emailId}&tid=${trackingId}`;
  const trackingWebhookUrl = `${TRACKING_BASE_URL}/api/email/webhook?provider=${EMAIL_PROVIDER}`;

  // Generate tracking links in the body
  const processedBody = generateTrackingLinks(emailId, params.body);

  // Append tracking pixel to HTML body if provided, otherwise to plain body
  const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;" />`;
  const htmlWithPixel = params.htmlBody
    ? `${params.htmlBody}${trackingPixel}`
    : undefined;

  const now = new Date().toISOString();

  try {
    const { db } = await import('@/lib/db');

    await db.outreach.create({
      data: {
        leadId: params.leadId,
        channel: 'email',
        type: params.templateId ? 'template_email' : 'direct_email',
        subject: params.subject,
        body: processedBody,
        status: 'sent',
        metadata: {
          emailId,
          trackingId,
          to: params.to,
          from: params.from,
          replyTo: params.replyTo,
          htmlBody: htmlWithPixel,
          templateId: params.templateId,
          sequenceId: params.sequenceId,
          sequenceStep: params.sequenceStep,
          campaignId: params.campaignId,
          trackingPixelUrl,
          trackingWebhookUrl,
          sentAt: now,
          provider: EMAIL_PROVIDER,
          ...params.metadata,
        },
      },
    });

    // Record the "sent" tracking event
    await recordTrackingEvent(emailId, 'sent', {
      leadId: params.leadId,
      to: params.to,
      provider: EMAIL_PROVIDER,
      sequenceId: params.sequenceId,
      sequenceStep: params.sequenceStep,
    });
  } catch (error) {
    console.warn('[EmailEngine] sendEmail DB write failed:', error);
  }

  // TODO: When email provider (Resend/SendGrid) is configured, send the actual email here:
  // if (EMAIL_PROVIDER === 'resend') {
  //   const { Resend } = await import('resend');
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({ from, to, subject, html: htmlWithPixel, replyTo });
  // } else if (EMAIL_PROVIDER === 'sendgrid') {
  //   // SendGrid integration
  // }

  return {
    emailId,
    status: 'sent',
    trackingPixelUrl,
    trackingWebhookUrl,
    timestamp: now,
  };
}

/**
 * Send a specific step from an email sequence to a lead.
 */
export async function sendSequenceStep(
  leadId: string,
  sequenceId: string,
  stepNumber: number
): Promise<SendEmailResult | null> {
  try {
    const { db } = await import('@/lib/db');

    // Get sequence
    const sequenceData = await db.outreach.findFirst({
      where: { id: sequenceId, type: 'email_sequence' },
    });

    if (!sequenceData) {
      console.warn(`[EmailEngine] Sequence ${sequenceId} not found`);
      return null;
    }

    const sequence = parseSequenceFromDb(sequenceData);
    const step = sequence.steps.find(s => s.stepNumber === stepNumber);

    if (!step) {
      console.warn(`[EmailEngine] Step ${stepNumber} not found in sequence ${sequenceId}`);
      return null;
    }

    // Get the template for this step
    const templates = await getEmailTemplates();
    const template = templates.find(t => t.id === step.templateId) || FALLBACK_TEMPLATES.find(t => t.id === step.templateId);

    // Get lead data
    const lead = await db.lead.findUnique({ where: { id: leadId } });

    let subject: string;
    let body: string;

    if (template && lead) {
      const personalized = await personalizeTemplate(template, {
        firstName: lead.firstName as string || undefined,
        lastName: lead.lastName as string || undefined,
        email: lead.email as string || undefined,
        company: lead.company as string || undefined,
        industry: lead.industry as string || undefined,
        title: lead.title as string || undefined,
      });
      subject = personalized.subject;
      body = personalized.body;
    } else if (template) {
      // Simple variable substitution without lead data
      subject = template.subject;
      body = template.body;
    } else {
      subject = 'Following up';
      body = 'Hi, just following up on our previous conversation.';
    }

    return sendEmail({
      leadId,
      to: (lead?.email as string) || '',
      subject,
      body,
      templateId: step.templateId,
      sequenceId,
      sequenceStep: stepNumber,
    });
  } catch (error) {
    console.warn('[EmailEngine] sendSequenceStep failed:', error);
    return null;
  }
}

/**
 * Schedule an email sequence for a list of leads.
 * Creates enrollment records and queues the first step.
 */
export async function scheduleSequence(
  sequenceId: string,
  leadIds: string[]
): Promise<{ enrolled: number; errors: string[] }> {
  const errors: string[] = [];
  let enrolled = 0;

  for (const leadId of leadIds) {
    try {
      // Check if lead is suppressed
      const { db } = await import('@/lib/db');
      const lead = await db.lead.findUnique({ where: { id: leadId } });

      if (!lead) {
        errors.push(`Lead ${leadId} not found`);
        continue;
      }

      const leadEmail = lead.email as string;
      if (leadEmail && isSuppressed(leadEmail)) {
        errors.push(`Lead ${leadId} (${leadEmail}) is suppressed`);
        continue;
      }

      // Check if lead is already enrolled in this sequence
      const existing = await db.outreach.findFirst({
        where: {
          leadId,
          type: 'sequence_enrollment',
          metadata: { sequenceId },
        },
      });

      if (existing) {
        errors.push(`Lead ${leadId} already enrolled in sequence ${sequenceId}`);
        continue;
      }

      // Create enrollment record
      const now = new Date().toISOString();
      await db.outreach.create({
        data: {
          leadId,
          channel: 'email',
          type: 'sequence_enrollment',
          subject: `Enrollment: ${sequenceId}`,
          body: '',
          status: 'sent',
          metadata: {
            sequenceId,
            currentStep: 1,
            enrollmentStatus: 'active',
            enrolledAt: now,
            lastStepAt: now,
            nextStepAt: now, // First step is immediate
          },
        },
      });

      // Send the first step immediately
      await sendSequenceStep(leadId, sequenceId, 1);

      enrolled++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Lead ${leadId}: ${msg}`);
    }
  }

  // Update sequence enrolled count
  try {
    const { db } = await import('@/lib/db');
    await db.outreach.update({
      where: { id: sequenceId },
      data: {
        metadata: { enrolledCount: enrolled },
      },
    });
  } catch {
    // Non-critical — enrollment still worked
  }

  return { enrolled, errors };
}

// ============================================================
// 3. Email Tracking
// ============================================================

/**
 * Record an email tracking event.
 */
export async function recordTrackingEvent(
  emailId: string,
  eventType: EmailEventType,
  metadata: Record<string, unknown> = {}
): Promise<EmailTrackingEvent> {
  const event: EmailTrackingEvent = {
    id: generateId('evt'),
    emailId,
    event: eventType,
    timestamp: new Date().toISOString(),
    metadata,
  };

  try {
    const { db } = await import('@/lib/db');

    await db.outreach.create({
      data: {
        channel: 'email',
        type: 'tracking_event',
        subject: `Event: ${eventType}`,
        body: JSON.stringify(event),
        status: 'sent',
        metadata: {
          emailId,
          eventType,
          eventTimestamp: event.timestamp,
          ...metadata,
        },
      },
    });

    // If bounced, process it
    if (eventType === 'bounced') {
      await processBounce(emailId, (metadata.bounceType as 'hard' | 'soft') || 'soft');
    }
  } catch (error) {
    console.warn('[EmailEngine] recordTrackingEvent DB write failed:', error);
  }

  return event;
}

/**
 * Get all tracking events for a specific email.
 */
export async function getTrackingEvents(emailId: string): Promise<EmailTrackingEvent[]> {
  try {
    const { db } = await import('@/lib/db');

    const rows = await db.outreach.findMany({
      where: {
        type: 'tracking_event',
        metadata: { emailId },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row: Record<string, unknown>) => {
      try {
        const parsed = typeof row.body === 'string' ? JSON.parse(row.body) : row.body;
        return {
          id: row.id as string,
          emailId: (row.metadata as Record<string, unknown>)?.emailId as string || emailId,
          event: (row.metadata as Record<string, unknown>)?.eventType as EmailEventType || 'sent',
          timestamp: (row.metadata as Record<string, unknown>)?.eventTimestamp as string || (row.createdAt as string),
          metadata: (row.metadata as Record<string, unknown>) || {},
        };
      } catch {
        return {
          id: row.id as string,
          emailId,
          event: 'sent' as EmailEventType,
          timestamp: (row.createdAt as string) || new Date().toISOString(),
          metadata: {},
        };
      }
    });
  } catch (error) {
    console.warn('[EmailEngine] getTrackingEvents failed:', error);
    return [];
  }
}

/**
 * Process an incoming email webhook payload (from Resend, SendGrid, etc.).
 * Parses the payload and records the appropriate tracking event.
 */
export async function processWebhook(payload: {
  provider?: string;
  event?: string;
  emailId?: string;
  recipient?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}): Promise<EmailTrackingEvent | null> {
  const { provider = EMAIL_PROVIDER, event, emailId, recipient, timestamp, metadata = {} } = payload;

  if (!event || !emailId) {
    console.warn('[EmailEngine] processWebhook: missing event or emailId');
    return null;
  }

  // Normalize event types across providers
  const eventMap: Record<string, EmailEventType> = {
    // Resend events
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
    'email.replied': 'replied',
    'email.bounced': 'bounced',
    'email.complained': 'bounced', // Treat complaints as bounces initially
    // SendGrid events
    'processed': 'sent',
    'delivered': 'delivered',
    'open': 'opened',
    'click': 'clicked',
    'reply': 'replied',
    'bounce': 'bounced',
    'spamreport': 'bounced',
    'deferred': 'delivered',
    // Generic fallbacks
    'sent': 'sent',
  };

  const normalizedEvent = eventMap[event] || 'sent';

  // Handle spam complaints separately
  if (event === 'email.complained' || event === 'spamreport') {
    await processComplaint(emailId);
  }

  return recordTrackingEvent(emailId, normalizedEvent, {
    provider,
    recipient,
    originalEvent: event,
    webhookTimestamp: timestamp,
    ...metadata,
  });
}

/**
 * Generate a tracking pixel URL for an email.
 */
export function generateTrackingPixel(emailId: string): string {
  const tid = generateTrackingId();
  return `${TRACKING_BASE_URL}/api/email/track?event=opened&eid=${emailId}&tid=${tid}`;
}

/**
 * Replace links in an email body with tracking links.
 * Each original URL is wrapped with a redirect through our tracking endpoint.
 */
export function generateTrackingLinks(emailId: string, body: string): string {
  const tid = generateTrackingId();
  const urlRegex = /href="(https?:\/\/[^"]+)"/gi;

  return body.replace(urlRegex, (match, originalUrl: string) => {
    const encodedUrl = encodeURIComponent(originalUrl);
    const trackingUrl = `${TRACKING_BASE_URL}/api/email/track?event=clicked&eid=${emailId}&tid=${tid}&url=${encodedUrl}`;
    return `href="${trackingUrl}"`;
  });
}

// ============================================================
// 4. Email Engagement Analytics
// ============================================================

/**
 * Calculate an engagement score (0–100) for a lead based on their email interactions.
 * Uses LLM for sophisticated scoring when available, falls back to weighted formula.
 */
export async function calculateEngagementScore(leadId: string): Promise<EmailEngagementScore> {
  try {
    const { db } = await import('@/lib/db');

    // Get all email tracking events for this lead
    const outreachRows = await db.outreach.findMany({
      where: { leadId, channel: 'email' },
      orderBy: { createdAt: 'desc' },
    });

    const eventRows = await db.outreach.findMany({
      where: { type: 'tracking_event', metadata: { leadId } },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate raw metrics
    const sentCount = eventRows.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'sent'
    ).length || outreachRows.length || 1;

    const openedCount = eventRows.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'opened'
    ).length;

    const clickedCount = eventRows.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'clicked'
    ).length;

    const repliedCount = eventRows.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'replied'
    ).length;

    const bouncedCount = eventRows.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'bounced'
    ).length;

    const openRate = sentCount > 0 ? openedCount / sentCount : 0;
    const clickRate = sentCount > 0 ? clickedCount / sentCount : 0;
    const replyRate = sentCount > 0 ? repliedCount / sentCount : 0;
    const bounceRate = sentCount > 0 ? bouncedCount / sentCount : 0;

    // Calculate engagement velocity (how quickly the lead engages after receiving)
    const sentEvents = eventRows.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'sent'
    );
    const openEvents = eventRows.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'opened'
    );

    let avgResponseTimeMs = 24 * 60 * 60 * 1000; // Default: 24 hours
    if (sentEvents.length > 0 && openEvents.length > 0) {
      const responseTimes: number[] = [];
      for (const openEvt of openEvents) {
        const openTime = new Date((openEvt.metadata as Record<string, unknown>)?.eventTimestamp as string || openEvt.createdAt as string).getTime();
        // Find the nearest preceding sent event
        for (const sentEvt of sentEvents) {
          const sentTime = new Date((sentEvt.metadata as Record<string, unknown>)?.eventTimestamp as string || sentEvt.createdAt as string).getTime();
          if (sentTime <= openTime) {
            responseTimes.push(openTime - sentTime);
            break;
          }
        }
      }
      if (responseTimes.length > 0) {
        avgResponseTimeMs = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      }
    }

    // Velocity: 1.0 if they respond within 1 hour, 0.0 if they take > 48 hours
    const oneHour = 60 * 60 * 1000;
    const fortyEightHours = 48 * 60 * 60 * 1000;
    const engagementVelocity = Math.max(0, Math.min(1,
      1 - (avgResponseTimeMs - oneHour) / (fortyEightHours - oneHour)
    ));

    // Try LLM-powered scoring for context-aware adjustments
    try {
      const systemPrompt = `You are an email engagement scoring expert. Given raw email metrics, calculate a composite engagement score (0-100) that accounts for:
- Open rate (weighted 20%)
- Click rate (weighted 30%)  
- Reply rate (weighted 35%)
- Bounce rate (negative, weighted -10%)
- Engagement velocity (weighted 25%)
- Diminishing returns on high volume
- Recency weighting (recent engagement matters more)
Return ONLY valid JSON.`;

      const userMessage = `Calculate engagement score for this lead:
- Emails sent: ${sentCount}
- Opens: ${openedCount} (rate: ${(openRate * 100).toFixed(1)}%)
- Clicks: ${clickedCount} (rate: ${(clickRate * 100).toFixed(1)}%)
- Replies: ${repliedCount} (rate: ${(replyRate * 100).toFixed(1)}%)
- Bounces: ${bouncedCount} (rate: ${(bounceRate * 100).toFixed(1)}%)
- Avg response time: ${(avgResponseTimeMs / (60 * 60 * 1000)).toFixed(1)} hours

Return JSON: { "score": number, "reasoning": "brief explanation" }`;

      const result = await callLLMForJSON<{ score: number; reasoning: string }>(systemPrompt, userMessage, {
        temperature: 0.3,
        retriesPerModel: 2,
        useFallback: true,
      });

      if (result && typeof result.score === 'number') {
        return {
          leadId,
          score: Math.max(0, Math.min(100, Math.round(result.score))),
          breakdown: { openRate, clickRate, replyRate, bounceRate, engagementVelocity },
          calculatedAt: new Date().toISOString(),
        };
      }
    } catch {
      // Fall through to formula-based scoring
    }

    // Formula-based scoring (weighted)
    const score = Math.round(
      Math.min(100, Math.max(0,
        (openRate * 20) +
        (clickRate * 30) +
        (replyRate * 35) +
        (engagementVelocity * 25) -
        (bounceRate * 10)
      ))
    );

    return {
      leadId,
      score,
      breakdown: { openRate, clickRate, replyRate, bounceRate, engagementVelocity },
      calculatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[EmailEngine] calculateEngagementScore failed:', error);
    return {
      leadId,
      score: 0,
      breakdown: { openRate: 0, clickRate: 0, replyRate: 0, bounceRate: 0, engagementVelocity: 0 },
      calculatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Get email analytics for a campaign or globally.
 */
export async function getEmailAnalytics(campaignId?: string): Promise<EmailAnalytics> {
  try {
    const { db } = await import('@/lib/db');

    const where: Record<string, unknown> = {
      type: 'tracking_event',
      channel: 'email',
    };
    if (campaignId) {
      where.metadata = { campaignId };
    }

    const events = await db.outreach.findMany({ where });

    const totalSent = events.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'sent'
    ).length;

    const delivered = events.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'delivered'
    ).length;

    const opens = events.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'opened'
    ).length;

    const clicks = events.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'clicked'
    ).length;

    const replies = events.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'replied'
    ).length;

    const bounces = events.filter((r: Record<string, unknown>) =>
      (r.metadata as Record<string, unknown>)?.eventType === 'bounced'
    ).length;

    const base = totalSent || 1;

    return {
      totalSent,
      delivered,
      opens,
      clicks,
      replies,
      bounces,
      openRate: opens / base,
      clickRate: clicks / base,
      replyRate: replies / base,
      bounceRate: bounces / base,
      period: {
        start: events.length > 0
          ? (events[events.length - 1] as Record<string, unknown>).createdAt as string
          : new Date().toISOString(),
        end: events.length > 0
          ? (events[0] as Record<string, unknown>).createdAt as string
          : new Date().toISOString(),
      },
      campaignId,
    };
  } catch (error) {
    console.warn('[EmailEngine] getEmailAnalytics failed:', error);
    return {
      totalSent: 0, delivered: 0, opens: 0, clicks: 0, replies: 0, bounces: 0,
      openRate: 0, clickRate: 0, replyRate: 0, bounceRate: 0,
      period: { start: new Date().toISOString(), end: new Date().toISOString() },
      campaignId,
    };
  }
}

/**
 * Get templates ranked by engagement metrics.
 */
export async function getBestPerformingTemplates(): Promise<Array<EmailTemplate & { metrics: { openRate: number; clickRate: number; replyRate: number; sentCount: number } }>> {
  try {
    const { db } = await import('@/lib/db');

    // Get all template-based emails with their tracking events
    const templateEmails = await db.outreach.findMany({
      where: { type: 'template_email', channel: 'email' },
    });

    // Group by templateId and calculate metrics
    const templateMetrics: Record<string, { sent: number; opened: number; clicked: number; replied: number }> = {};

    for (const email of templateEmails) {
      const templateId = (email.metadata as Record<string, unknown>)?.templateId as string;
      if (!templateId) continue;

      if (!templateMetrics[templateId]) {
        templateMetrics[templateId] = { sent: 0, opened: 0, clicked: 0, replied: 0 };
      }
      templateMetrics[templateId].sent++;

      // Get tracking events for this email
      const emailId = (email.metadata as Record<string, unknown>)?.emailId as string;
      if (emailId) {
        const events = await getTrackingEvents(emailId);
        for (const event of events) {
          if (event.event === 'opened') templateMetrics[templateId].opened++;
          if (event.event === 'clicked') templateMetrics[templateId].clicked++;
          if (event.event === 'replied') templateMetrics[templateId].replied++;
        }
      }
    }

    // Merge with templates
    const templates = await getEmailTemplates();
    const results = templates.map(t => {
      const metrics = templateMetrics[t.id] || { sent: 0, opened: 0, clicked: 0, replied: 0 };
      const base = metrics.sent || 1;
      return {
        ...t,
        metrics: {
          openRate: metrics.opened / base,
          clickRate: metrics.clicked / base,
          replyRate: metrics.replied / base,
          sentCount: metrics.sent,
        },
      };
    });

    // Sort by reply rate (most important metric), then click rate
    results.sort((a, b) => {
      const aScore = a.metrics.replyRate * 0.5 + a.metrics.clickRate * 0.3 + a.metrics.openRate * 0.2;
      const bScore = b.metrics.replyRate * 0.5 + b.metrics.clickRate * 0.3 + b.metrics.openRate * 0.2;
      return bScore - aScore;
    });

    return results;
  } catch (error) {
    console.warn('[EmailEngine] getBestPerformingTemplates failed:', error);
    return FALLBACK_TEMPLATES.map(t => ({
      ...t,
      metrics: { openRate: 0, clickRate: 0, replyRate: 0, sentCount: 0 },
    }));
  }
}

/**
 * Get performance metrics for a specific email sequence.
 */
export async function getSequencePerformance(sequenceId: string): Promise<SequencePerformance | null> {
  try {
    const { db } = await import('@/lib/db');

    // Get sequence definition
    const sequenceData = await db.outreach.findFirst({
      where: { id: sequenceId, type: 'email_sequence' },
    });

    if (!sequenceData) return null;

    const sequence = parseSequenceFromDb(sequenceData);

    // Get all enrollments for this sequence
    const enrollments = await db.outreach.findMany({
      where: { type: 'sequence_enrollment', metadata: { sequenceId } },
    });

    const activeCount = enrollments.filter((e: Record<string, unknown>) =>
      (e.metadata as Record<string, unknown>)?.enrollmentStatus === 'active'
    ).length;

    const completedCount = enrollments.filter((e: Record<string, unknown>) =>
      (e.metadata as Record<string, unknown>)?.enrollmentStatus === 'completed'
    ).length;

    const optedOutCount = enrollments.filter((e: Record<string, unknown>) =>
      (e.metadata as Record<string, unknown>)?.enrollmentStatus === 'opted_out'
    ).length;

    // Calculate step-level metrics
    const stepMetrics = await Promise.all(
      sequence.steps.map(async (step) => {
        const stepEmails = await db.outreach.findMany({
          where: {
            type: 'template_email',
            channel: 'email',
            metadata: { sequenceId, sequenceStep: step.stepNumber },
          },
        });

        const sent = stepEmails.length;
        let opened = 0;
        let clicked = 0;
        let replied = 0;
        let bounced = 0;

        for (const email of stepEmails) {
          const emailId = (email.metadata as Record<string, unknown>)?.emailId as string;
          if (emailId) {
            const events = await getTrackingEvents(emailId);
            for (const event of events) {
              if (event.event === 'opened') opened++;
              if (event.event === 'clicked') clicked++;
              if (event.event === 'replied') replied++;
              if (event.event === 'bounced') bounced++;
            }
          }
        }

        return { stepNumber: step.stepNumber, sent, opened, clicked, replied, bounced };
      })
    );

    const totalSent = stepMetrics.reduce((a, s) => a + s.sent, 0) || 1;
    const totalOpens = stepMetrics.reduce((a, s) => a + s.opened, 0);
    const totalReplies = stepMetrics.reduce((a, s) => a + s.replied, 0);

    return {
      sequenceId,
      sequenceName: (sequenceData.subject as string) || sequence.name,
      totalEnrolled: enrollments.length,
      completedCount,
      activeCount,
      optOutCount: optedOutCount,
      overallReplyRate: totalReplies / totalSent,
      overallOpenRate: totalOpens / totalSent,
      stepMetrics,
    };
  } catch (error) {
    console.warn('[EmailEngine] getSequencePerformance failed:', error);
    return null;
  }
}

// ============================================================
// 5. Email Sequence Engine
// ============================================================

/**
 * Create a new email sequence.
 */
export async function createSequence(
  name: string,
  steps: Omit<EmailSequenceStep, 'stepNumber'>[]
): Promise<EmailSequence> {
  const sequenceId = generateId('seq');
  const now = new Date().toISOString();

  const sequence: EmailSequence = {
    id: sequenceId,
    name,
    steps: steps.map((s, i) => ({
      ...s,
      stepNumber: i + 1,
    })),
    status: 'draft',
    enrolledCount: 0,
    responseRate: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const { db } = await import('@/lib/db');

    await db.outreach.create({
      data: {
        id: sequenceId,
        channel: 'email',
        type: 'email_sequence',
        subject: name,
        body: JSON.stringify(sequence.steps),
        status: 'draft',
        metadata: {
          sequenceName: name,
          stepCount: steps.length,
          enrolledCount: 0,
          responseRate: 0,
        },
      },
    });
  } catch (error) {
    console.warn('[EmailEngine] createSequence DB write failed:', error);
  }

  return sequence;
}

/**
 * Enroll a lead in an email sequence.
 */
export async function enrollLeadInSequence(leadId: string, sequenceId: string): Promise<LeadSequenceEnrollment | null> {
  // Check suppression
  try {
    const { db } = await import('@/lib/db');
    const lead = await db.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      console.warn(`[EmailEngine] Lead ${leadId} not found`);
      return null;
    }

    const leadEmail = lead.email as string;
    if (leadEmail && isSuppressed(leadEmail)) {
      console.warn(`[EmailEngine] Lead ${leadId} (${leadEmail}) is suppressed`);
      return null;
    }

    // Check for existing enrollment
    const existing = await db.outreach.findFirst({
      where: {
        leadId,
        type: 'sequence_enrollment',
        metadata: { sequenceId },
      },
    });

    if (existing) {
      console.warn(`[EmailEngine] Lead ${leadId} already enrolled in sequence ${sequenceId}`);
      return null;
    }

    const now = new Date().toISOString();
    const enrollmentId = generateId('enr');

    await db.outreach.create({
      data: {
        id: enrollmentId,
        leadId,
        channel: 'email',
        type: 'sequence_enrollment',
        subject: `Enrollment: ${sequenceId}`,
        body: '',
        status: 'sent',
        metadata: {
          sequenceId,
          enrollmentId,
          currentStep: 1,
          enrollmentStatus: 'active',
          enrolledAt: now,
          lastStepAt: now,
          nextStepAt: now,
        },
      },
    });

    // Send the first step immediately
    await sendSequenceStep(leadId, sequenceId, 1);

    // Update sequence enrolled count
    const sequenceData = await db.outreach.findFirst({
      where: { id: sequenceId, type: 'email_sequence' },
    });

    if (sequenceData) {
      const currentCount = ((sequenceData.metadata as Record<string, unknown>)?.enrolledCount as number) || 0;
      await db.outreach.update({
        where: { id: sequenceId },
        data: {
          metadata: { enrolledCount: currentCount + 1 },
        },
      });
    }

    return {
      id: enrollmentId,
      leadId,
      sequenceId,
      currentStep: 1,
      status: 'active',
      enrolledAt: now,
      lastStepAt: now,
      nextStepAt: now,
    };
  } catch (error) {
    console.warn('[EmailEngine] enrollLeadInSequence failed:', error);
    return null;
  }
}

/**
 * Advance a lead to the next step in a sequence based on conditions.
 * Evaluates step conditions and decides whether to send, skip, or pause.
 */
export async function advanceSequence(leadId: string, sequenceId: string): Promise<{ advanced: boolean; newStep: number; action: string }> {
  try {
    const { db } = await import('@/lib/db');

    // Get enrollment
    const enrollment = await db.outreach.findFirst({
      where: {
        leadId,
        type: 'sequence_enrollment',
        metadata: { sequenceId },
      },
    });

    if (!enrollment) {
      return { advanced: false, newStep: 0, action: 'no_enrollment' };
    }

    const enrollmentMeta = enrollment.metadata as Record<string, unknown>;
    const currentStep = (enrollmentMeta.currentStep as number) || 1;
    const enrollmentStatus = (enrollmentMeta.enrollmentStatus as string) || 'active';

    if (enrollmentStatus !== 'active') {
      return { advanced: false, newStep: currentStep, action: `enrollment_${enrollmentStatus}` };
    }

    // Get sequence
    const sequenceData = await db.outreach.findFirst({
      where: { id: sequenceId, type: 'email_sequence' },
    });

    if (!sequenceData) {
      return { advanced: false, newStep: currentStep, action: 'sequence_not_found' };
    }

    const sequence = parseSequenceFromDb(sequenceData);
    const nextStepNumber = currentStep + 1;

    // Check if sequence is complete
    if (nextStepNumber > sequence.steps.length) {
      await db.outreach.update({
        where: { id: enrollment.id as string },
        data: {
          metadata: {
            ...enrollmentMeta,
            currentStep: nextStepNumber - 1,
            enrollmentStatus: 'completed',
            completedAt: new Date().toISOString(),
          },
        },
      });

      return { advanced: true, newStep: nextStepNumber - 1, action: 'completed' };
    }

    const nextStep = sequence.steps.find(s => s.stepNumber === nextStepNumber);
    if (!nextStep) {
      return { advanced: false, newStep: currentStep, action: 'step_not_found' };
    }

    // Evaluate conditions for the next step
    let shouldSend = true;
    let actionReason = 'send';

    if (nextStep.conditions && nextStep.conditions.length > 0) {
      // Get recent tracking events for this lead in this sequence
      const recentEvents = await db.outreach.findMany({
        where: {
          leadId,
          type: 'tracking_event',
          metadata: { sequenceId },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const leadEventTypes = new Set(
        recentEvents.map((r: Record<string, unknown>) =>
          (r.metadata as Record<string, unknown>)?.eventType as string
        )
      );

      for (const condition of nextStep.conditions) {
        const conditionMet = condition.type === 'no_action'
          ? !leadEventTypes.has('opened') && !leadEventTypes.has('clicked') && !leadEventTypes.has('replied')
          : leadEventTypes.has(condition.type);

        if (conditionMet) {
          switch (condition.action) {
            case 'skip':
              shouldSend = false;
              actionReason = `skipped_condition_${condition.type}`;
              // Recursively advance to the next step
              return advanceSequence(leadId, sequenceId);
            case 'pause':
              shouldSend = false;
              actionReason = `paused_condition_${condition.type}`;
              await pauseSequence(leadId, sequenceId);
              return { advanced: false, newStep: currentStep, action: actionReason };
            case 'advance':
              shouldSend = true;
              actionReason = `advanced_condition_${condition.type}`;
              break;
            case 'send':
            default:
              shouldSend = true;
              actionReason = `send_condition_${condition.type}`;
              break;
          }
        }
      }
    }

    const now = new Date().toISOString();
    const nextStepAt = new Date(Date.now() + nextStep.delayDays * 24 * 60 * 60 * 1000).toISOString();

    if (shouldSend) {
      await sendSequenceStep(leadId, sequenceId, nextStepNumber);
    }

    // Update enrollment
    await db.outreach.update({
      where: { id: enrollment.id as string },
      data: {
        metadata: {
          ...enrollmentMeta,
          currentStep: nextStepNumber,
          lastStepAt: now,
          nextStepAt,
        },
      },
    });

    return { advanced: true, newStep: nextStepNumber, action: actionReason };
  } catch (error) {
    console.warn('[EmailEngine] advanceSequence failed:', error);
    return { advanced: false, newStep: 0, action: 'error' };
  }
}

/**
 * Pause a sequence for a specific lead.
 */
export async function pauseSequence(leadId: string, sequenceId: string): Promise<boolean> {
  try {
    const { db } = await import('@/lib/db');

    const enrollment = await db.outreach.findFirst({
      where: {
        leadId,
        type: 'sequence_enrollment',
        metadata: { sequenceId },
      },
    });

    if (!enrollment) return false;

    const enrollmentMeta = enrollment.metadata as Record<string, unknown>;

    await db.outreach.update({
      where: { id: enrollment.id as string },
      data: {
        metadata: {
          ...enrollmentMeta,
          enrollmentStatus: 'paused',
          pausedAt: new Date().toISOString(),
        },
      },
    });

    return true;
  } catch (error) {
    console.warn('[EmailEngine] pauseSequence failed:', error);
    return false;
  }
}

/**
 * Get all active sequences for a lead.
 */
export async function getSequencesForLead(leadId: string): Promise<LeadSequenceEnrollment[]> {
  try {
    const { db } = await import('@/lib/db');

    const enrollments = await db.outreach.findMany({
      where: {
        leadId,
        type: 'sequence_enrollment',
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollments.map((e: Record<string, unknown>) => {
      const meta = e.metadata as Record<string, unknown>;
      return {
        id: (meta.enrollmentId as string) || e.id as string,
        leadId,
        sequenceId: (meta.sequenceId as string) || '',
        currentStep: (meta.currentStep as number) || 1,
        status: (meta.enrollmentStatus as LeadSequenceEnrollment['status']) || 'active',
        enrolledAt: (meta.enrolledAt as string) || (e.createdAt as string),
        lastStepAt: meta.lastStepAt as string | undefined,
        nextStepAt: meta.nextStepAt as string | undefined,
      };
    });
  } catch (error) {
    console.warn('[EmailEngine] getSequencesForLead failed:', error);
    return [];
  }
}

// ============================================================
// 6. Bounce & Complaint Handling
// ============================================================

/**
 * Process a bounced email. Hard bounces suppress the email address;
 * soft bounces are tracked but don't suppress immediately.
 */
export async function processBounce(emailId: string, bounceType: 'hard' | 'soft'): Promise<void> {
  try {
    const { db } = await import('@/lib/db');

    // Find the original email
    const email = await db.outreach.findFirst({
      where: {
        type: 'tracking_event',
        metadata: { emailId, eventType: 'sent' },
      },
    });

    if (!email) {
      // Try finding by emailId in outreach
      const outreachEmail = await db.outreach.findFirst({
        where: {
          channel: 'email',
          metadata: { emailId },
        },
      });

      if (!outreachEmail) {
        console.warn(`[EmailEngine] processBounce: could not find email ${emailId}`);
        return;
      }

      const meta = outreachEmail.metadata as Record<string, unknown>;
      const recipientEmail = meta.to as string;
      const leadId = outreachEmail.leadId as string;

      if (bounceType === 'hard' && recipientEmail) {
        addToSuppressionList(recipientEmail, 'hard_bounce', `Hard bounce on email ${emailId}`);

        // Update lead reachability
        await db.lead.update({
          where: { id: leadId },
          data: { status: 'unreachable' },
        }).catch(() => {
          // Lead might not exist or field might not exist
        });
      }

      // Record the bounce event
      await recordTrackingEvent(emailId, 'bounced', {
        bounceType,
        recipientEmail,
        leadId,
      });

      return;
    }

    const meta = email.metadata as Record<string, unknown>;
    const recipientEmail = meta.to as string || meta.recipient as string;
    const leadId = meta.leadId as string;

    if (bounceType === 'hard' && recipientEmail) {
      addToSuppressionList(recipientEmail, 'hard_bounce', `Hard bounce on email ${emailId}`);

      // Update lead reachability
      if (leadId) {
        await db.lead.update({
          where: { id: leadId },
          data: { status: 'unreachable' },
        }).catch(() => {});
      }
    }

    // Pause any active sequences for this lead on hard bounce
    if (bounceType === 'hard' && leadId) {
      const enrollments = await db.outreach.findMany({
        where: {
          leadId,
          type: 'sequence_enrollment',
        },
      });

      for (const enrollment of enrollments) {
        const enrollMeta = enrollment.metadata as Record<string, unknown>;
        if (enrollMeta.enrollmentStatus === 'active' && enrollMeta.sequenceId) {
          await pauseSequence(leadId, enrollMeta.sequenceId as string);
        }
      }
    }
  } catch (error) {
    console.warn('[EmailEngine] processBounce failed:', error);
  }
}

/**
 * Process a spam complaint. Suppresses the email address immediately
 * and pauses all sequences for the lead.
 */
export async function processComplaint(emailId: string): Promise<void> {
  try {
    const { db } = await import('@/lib/db');

    // Find the original email
    const email = await db.outreach.findFirst({
      where: {
        channel: 'email',
        metadata: { emailId },
      },
    });

    if (!email) {
      console.warn(`[EmailEngine] processComplaint: could not find email ${emailId}`);
      return;
    }

    const meta = email.metadata as Record<string, unknown>;
    const recipientEmail = meta.to as string;
    const leadId = email.leadId as string;

    // Immediately suppress the email
    if (recipientEmail) {
      addToSuppressionList(recipientEmail, 'complaint', `Spam complaint on email ${emailId}`);
    }

    // Update lead status and pause all sequences
    if (leadId) {
      await db.lead.update({
        where: { id: leadId },
        data: { status: 'do_not_contact' },
      }).catch(() => {});

      // Pause all active sequences
      const enrollments = await db.outreach.findMany({
        where: {
          leadId,
          type: 'sequence_enrollment',
        },
      });

      for (const enrollment of enrollments) {
        const enrollMeta = enrollment.metadata as Record<string, unknown>;
        if (enrollMeta.sequenceId) {
          await pauseSequence(leadId, enrollMeta.sequenceId as string);
        }
      }

      // Update enrollment status to opted_out
      for (const enrollment of enrollments) {
        const enrollMeta = enrollment.metadata as Record<string, unknown>;
        await db.outreach.update({
          where: { id: enrollment.id as string },
          data: {
            metadata: {
              ...enrollMeta,
              enrollmentStatus: 'opted_out',
              optedOutAt: new Date().toISOString(),
              optOutReason: 'complaint',
            },
          },
        });
      }
    }

    // Record the complaint
    await recordTrackingEvent(emailId, 'bounced', {
      complaintType: 'spam',
      recipientEmail,
      leadId,
    });
  } catch (error) {
    console.warn('[EmailEngine] processComplaint failed:', error);
  }
}

/**
 * Get the list of suppressed email addresses.
 */
export function getSuppressionList(): SuppressedEmail[] {
  return [...suppressionList];
}

/**
 * Check if an email address is suppressed.
 */
export function isSuppressed(email: string): boolean {
  return suppressionList.some(s => s.email.toLowerCase() === email.toLowerCase());
}

/**
 * Add an email to the suppression list.
 */
function addToSuppressionList(email: string, reason: SuppressedEmail['reason'], details?: string): void {
  // Avoid duplicates
  if (isSuppressed(email)) return;

  suppressionList.push({
    email,
    reason,
    suppressedAt: new Date().toISOString(),
    details,
  });

  console.warn(`[EmailEngine] Email suppressed: ${email} (${reason})`);
}

/**
 * Remove an email from the suppression list (e.g., after a successful re-engagement).
 */
export function removeFromSuppressionList(email: string): boolean {
  const idx = suppressionList.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
  if (idx >= 0) {
    suppressionList.splice(idx, 1);
    return true;
  }
  return false;
}

// ============================================================
// Helpers
// ============================================================

/**
 * Parse an EmailSequence from a database row.
 */
function parseSequenceFromDb(row: Record<string, unknown>): EmailSequence {
  try {
    const meta = row.metadata as Record<string, unknown> || {};
    const steps = typeof row.body === 'string'
      ? JSON.parse(row.body)
      : Array.isArray(row.body)
        ? row.body
        : [];

    return {
      id: row.id as string,
      name: (row.subject as string) || (meta.sequenceName as string) || 'Unnamed Sequence',
      steps: Array.isArray(steps) ? steps : [],
      status: (['draft', 'active', 'paused', 'completed'].includes(row.status as string)
        ? row.status as EmailSequence['status']
        : 'draft'),
      enrolledCount: (meta.enrolledCount as number) || 0,
      responseRate: (meta.responseRate as number) || 0,
      createdAt: (row.createdAt as string) || new Date().toISOString(),
      updatedAt: (row.updatedAt as string) || new Date().toISOString(),
    };
  } catch {
    return {
      id: row.id as string || generateId('seq'),
      name: 'Error Parsing Sequence',
      steps: [],
      status: 'draft',
      enrolledCount: 0,
      responseRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Process all due sequence steps — should be called by a cron job.
 * Checks for enrollments where nextStepAt <= now and advances them.
 */
export async function processDueSequenceSteps(): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;
  const now = new Date().toISOString();

  try {
    const { db } = await import('@/lib/db');

    // Find all active enrollments where nextStepAt is in the past
    const dueEnrollments = await db.outreach.findMany({
      where: {
        type: 'sequence_enrollment',
        status: 'sent',
      },
    });

    for (const enrollment of dueEnrollments) {
      const meta = enrollment.metadata as Record<string, unknown>;
      const nextStepAt = meta.nextStepAt as string;
      const enrollmentStatus = meta.enrollmentStatus as string;
      const sequenceId = meta.sequenceId as string;
      const leadId = enrollment.leadId as string;

      if (enrollmentStatus !== 'active' || !sequenceId || !leadId) continue;
      if (!nextStepAt || new Date(nextStepAt) > new Date()) continue;

      const result = await advanceSequence(leadId, sequenceId);

      if (result.advanced) {
        processed++;
      } else if (result.action !== 'no_enrollment') {
        errors.push(`Lead ${leadId}, Sequence ${sequenceId}: ${result.action}`);
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Processing error: ${msg}`);
  }

  return { processed, errors };
}

/**
 * Initialize the suppression list from the database.
 * Should be called on application startup.
 */
export async function initializeSuppressionList(): Promise<void> {
  try {
    const { db } = await import('@/lib/db');

    // Find all leads with unreachable or do_not_contact status
    const suppressedLeads = await db.lead.findMany({
      where: {
        OR: [
          { status: 'unreachable' },
          { status: 'do_not_contact' },
        ],
      },
    });

    suppressionList = suppressedLeads
      .filter((lead: Record<string, unknown>) => lead.email)
      .map((lead: Record<string, unknown>) => ({
        email: lead.email as string,
        reason: (lead.status === 'do_not_contact' ? 'complaint' : 'hard_bounce') as SuppressedEmail['reason'],
        suppressedAt: (lead.updatedAt as string) || new Date().toISOString(),
        details: `Lead status: ${lead.status}`,
      }));

    console.log(`[EmailEngine] Initialized suppression list with ${suppressionList.length} entries`);
  } catch (error) {
    console.warn('[EmailEngine] initializeSuppressionList failed:', error);
    suppressionList = [];
  }
}
