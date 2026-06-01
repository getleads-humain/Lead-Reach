/**
 * Lead Intelligence Enhancement Engine — LeadReach
 * ==================================================
 *
 * Adds BEHAVIORAL TRACKING, SCORE DECAY, and PREDICTIVE SCORING
 * on top of the existing BANT / MEDDIC / Prospect scoring systems.
 *
 * Architecture:
 *   - Behavioral Event Tracking   → record & query lead interactions
 *   - Behavioral Profile Builder   → classify engagement, identify interests
 *   - Score Decay Engine           → model score degradation over inactivity
 *   - Predictive Scoring (AI)      → conversion probability, deal size, close date
 *   - Intelligence Alerts          → surface actionable signals
 *   - Composite Intelligence Score → unified multi-signal score
 *
 * Uses centralized callLLMForJSON for rate limiting, retries, and model fallback.
 * Falls back to deterministic heuristics when LLM is unavailable.
 */

import { callLLMForJSON } from '@/lib/llm';
import { db } from '@/lib/db';

// ============================================================
// Types
// ============================================================

export type BehavioralEventType =
  | 'email_open'
  | 'email_click'
  | 'email_reply'
  | 'website_visit'
  | 'content_download'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'proposal_viewed'
  | 'social_engagement'
  | 'form_submission';

export type EngagementLevel =
  | 'highly_engaged'
  | 'engaged'
  | 'moderately_engaged'
  | 'dormant'
  | 'cold';

export type ActivityTrend = 'increasing' | 'stable' | 'decreasing' | 'none';

export type AlertType =
  | 'engagement_spike'
  | 'engagement_drop'
  | 'score_decay_warning'
  | 'high_intent_signal'
  | 'at_risk_deal'
  | 're_engagement_opportunity';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export type FactorImpact = 'positive' | 'negative' | 'neutral';

export interface BehavioralEvent {
  id: string;
  leadId: string;
  eventType: BehavioralEventType;
  source: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

export interface TimelineEntry {
  timestamp: string;
  eventType: BehavioralEventType;
  summary: string;
}

export interface BehavioralProfile {
  leadId: string;
  totalEvents: number;
  recentActivity: ActivityTrend;
  engagementLevel: EngagementLevel;
  topInterests: string[];
  preferredChannels: string[];
  bestContactTime: string;
  activityTimeline: TimelineEntry[];
}

export interface ScoreDecayConfig {
  field: string;
  halfLifeDays: number;
  minScore: number;
}

export interface DecayedScore {
  leadId: string;
  originalScore: number;
  decayedScore: number;
  decayFactor: number;
  lastActivity: string | null;
  recommendation: string;
}

export interface ScoreFactor {
  factor: string;
  impact: FactorImpact;
  weight: number;
  description: string;
}

export interface PredictiveScore {
  leadId: string;
  conversionProbability: number;
  estimatedDealSize: number;
  estimatedCloseDate: string;
  confidenceLevel: number;
  keyFactors: ScoreFactor[];
  riskFactors: string[];
}

export interface IntelligenceAlert {
  id: string;
  leadId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  actionRequired: string;
  createdAt: string;
}

export interface CompositeScoreResult {
  leadId: string;
  compositeScore: number;
  tier: 'hot' | 'warm' | 'cold' | 'unqualified';
  breakdown: {
    bant: number;
    meddic: number;
    icpFit: number;
    behavioral: number;
    predictive: number;
    dataQuality: number;
  };
  recommendation: string;
  updatedAt: string;
}

// ============================================================
// Constants & Configuration
// ============================================================

/** How different event types contribute to engagement recency and weight */
const EVENT_WEIGHTS: Record<BehavioralEventType, { recencyReset: 'full' | 'partial' | 'none'; weight: number }> = {
  email_open:         { recencyReset: 'partial', weight: 2 },
  email_click:        { recencyReset: 'partial', weight: 4 },
  email_reply:        { recencyReset: 'full',    weight: 8 },
  website_visit:      { recencyReset: 'partial', weight: 3 },
  content_download:   { recencyReset: 'partial', weight: 6 },
  meeting_scheduled:  { recencyReset: 'full',    weight: 10 },
  meeting_completed:  { recencyReset: 'full',    weight: 12 },
  proposal_viewed:    { recencyReset: 'full',    weight: 9 },
  social_engagement:  { recencyReset: 'partial', weight: 2 },
  form_submission:    { recencyReset: 'full',    weight: 7 },
};

/** Default score decay configuration per scoring field */
const DEFAULT_DECAY_CONFIGS: ScoreDecayConfig[] = [
  { field: 'leadScore',          halfLifeDays: 30, minScore: 5 },
  { field: 'firmographicScore',  halfLifeDays: 90, minScore: 10 },
  { field: 'intentScore',        halfLifeDays: 21, minScore: 5 },
  { field: 'reachabilityScore',  halfLifeDays: 45, minScore: 10 },
  { field: 'strategicScore',     halfLifeDays: 60, minScore: 5 },
];

/** Engagement level thresholds */
const ENGAGEMENT_THRESHOLDS = {
  highly_engaged:       { minEvents: 5, windowDays: 7 },
  engaged:             { minEvents: 3, windowDays: 14 },
  moderately_engaged:  { minEvents: 1, windowDays: 30 },
  dormant:             { maxDaysSinceLast: 90 },
  cold:                { minDaysSinceLast: 90 },
} as const;

/** Composite score weights */
const COMPOSITE_WEIGHTS = {
  bant:         0.20,
  meddic:       0.20,
  icpFit:       0.15,
  behavioral:   0.20,
  predictive:   0.15,
  dataQuality:  0.10,
} as const;

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return `li_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function daysBetween(a: Date | string, b: Date | string): number {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db2 = typeof b === 'string' ? new Date(b) : b;
  return (db2.getTime() - da.getTime()) / (1000 * 60 * 60 * 24);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Extract the behavioral events JSON from a lead's notes field */
function parseEventsFromNotes(notes: string | null | undefined): BehavioralEvent[] {
  if (!notes) return [];
  try {
    // Look for a JSON block tagged with __lead_intelligence_events__
    const marker = '__lead_intelligence_events__';
    const idx = notes.indexOf(marker);
    if (idx === -1) return [];
    const jsonStart = notes.indexOf('[', idx);
    const jsonEnd = notes.lastIndexOf(']');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return [];
    const slice = notes.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(slice);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Build the notes string with embedded events JSON */
function buildNotesWithEvents(existingNotes: string | null | undefined, events: BehavioralEvent[]): string {
  const marker = '__lead_intelligence_events__';
  // Strip any existing embedded events block
  let cleanNotes = (existingNotes || '').trim();
  const markerIdx = cleanNotes.indexOf(marker);
  if (markerIdx !== -1) {
    cleanNotes = cleanNotes.slice(0, markerIdx).trim();
  }

  const eventsJson = JSON.stringify(events.slice(-500)); // keep last 500 events
  const block = `\n\n${marker}\n${eventsJson}\n`;

  return (cleanNotes + block).trim();
}

/** Extract alerts JSON from a lead's notes */
function parseAlertsFromNotes(notes: string | null | undefined): IntelligenceAlert[] {
  if (!notes) return [];
  try {
    const marker = '__lead_intelligence_alerts__';
    const idx = notes.indexOf(marker);
    if (idx === -1) return [];
    const jsonStart = notes.indexOf('[', idx);
    const jsonEnd = notes.lastIndexOf(']');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return [];
    const slice = notes.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(slice);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Build the notes string with embedded alerts JSON */
function buildNotesWithAlerts(existingNotes: string | null | undefined, alerts: IntelligenceAlert[]): string {
  const marker = '__lead_intelligence_alerts__';
  // Strip existing alerts block
  let cleanNotes = (existingNotes || '').trim();
  const markerIdx = cleanNotes.indexOf(marker);
  if (markerIdx !== -1) {
    cleanNotes = cleanNotes.slice(0, markerIdx).trim();
  }

  // Keep only non-dismissed alerts (no `dismissedAt` field)
  const activeAlerts = alerts.filter(a => !(a as any).dismissedAt);
  const alertsJson = JSON.stringify(activeAlerts.slice(-100)); // keep last 100
  const block = `\n\n${marker}\n${alertsJson}\n`;

  return (cleanNotes + block).trim();
}

/** Event type → human-readable label */
const EVENT_LABELS: Record<BehavioralEventType, string> = {
  email_open: 'Opened email',
  email_click: 'Clicked email link',
  email_reply: 'Replied to email',
  website_visit: 'Visited website',
  content_download: 'Downloaded content',
  meeting_scheduled: 'Scheduled meeting',
  meeting_completed: 'Completed meeting',
  proposal_viewed: 'Viewed proposal',
  social_engagement: 'Engaged on social media',
  form_submission: 'Submitted form',
};

// ============================================================
// 1. Behavioral Event Tracking
// ============================================================

/**
 * Record a behavioral event for a lead.
 * Events are stored as JSON embedded in the lead's `notes` field
 * so no schema migration is needed.
 */
export async function trackEvent(
  leadId: string,
  eventType: BehavioralEventType,
  source: string,
  properties: Record<string, unknown> = {},
): Promise<BehavioralEvent> {
  const event: BehavioralEvent = {
    id: generateId(),
    leadId,
    eventType,
    source,
    properties,
    timestamp: new Date().toISOString(),
  };

  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      console.warn(`[LeadIntel] trackEvent: lead ${leadId} not found`);
      return event;
    }

    const existingNotes = (lead.notes as string) || null;
    const events = parseEventsFromNotes(existingNotes);
    events.push(event);

    const updatedNotes = buildNotesWithEvents(existingNotes, events);

    // Also update lastContactDate for meaningful interactions
    const weight = EVENT_WEIGHTS[eventType];
    const updateData: Record<string, unknown> = {
      notes: updatedNotes,
    };
    if (weight.recencyReset === 'full') {
      updateData.lastContactDate = new Date().toISOString();
    }

    await db.lead.update({
      where: { id: leadId },
      data: updateData,
    });
  } catch (error) {
    console.error(`[LeadIntel] trackEvent failed for lead ${leadId}:`, error);
  }

  return event;
}

/**
 * Batch track multiple events at once.
 * Groups by leadId to minimise DB writes.
 */
export async function trackEventBatch(events: Array<{ leadId: string; eventType: BehavioralEventType; source: string; properties?: Record<string, unknown> }>): Promise<BehavioralEvent[]> {
  const tracked: BehavioralEvent[] = [];

  // Group events by leadId
  const byLead = new Map<string, Array<{ eventType: BehavioralEventType; source: string; properties: Record<string, unknown> }>>();
  for (const e of events) {
    const group = byLead.get(e.leadId) || [];
    group.push({ eventType: e.eventType, source: e.source, properties: e.properties || {} });
    byLead.set(e.leadId, group);
  }

  const leadEntries = Array.from(byLead.entries());
  for (const [leadId, leadEvents] of leadEntries) {
    try {
      const lead = await db.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        console.warn(`[LeadIntel] trackEventBatch: lead ${leadId} not found, skipping`);
        continue;
      }

      const existingNotes = (lead.notes as string) || null;
      const existing = parseEventsFromNotes(existingNotes);

      let needsFullReset = false;
      for (const e of leadEvents) {
        const event: BehavioralEvent = {
          id: generateId(),
          leadId,
          eventType: e.eventType,
          source: e.source,
          properties: e.properties,
          timestamp: new Date().toISOString(),
        };
        existing.push(event);
        tracked.push(event);
        if (EVENT_WEIGHTS[e.eventType].recencyReset === 'full') {
          needsFullReset = true;
        }
      }

      const updatedNotes = buildNotesWithEvents(existingNotes, existing);
      const updateData: Record<string, unknown> = { notes: updatedNotes };
      if (needsFullReset) {
        updateData.lastContactDate = new Date().toISOString();
      }

      await db.lead.update({
        where: { id: leadId },
        data: updateData,
      });
    } catch (error) {
      console.error(`[LeadIntel] trackEventBatch failed for lead ${leadId}:`, error);
    }
  }

  return tracked;
}

/**
 * Get a chronological timeline of events for a lead.
 */
export async function getEventTimeline(leadId: string, limit: number = 50): Promise<TimelineEntry[]> {
  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return [];

    const events = parseEventsFromNotes(lead.notes as string);
    const sorted = events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return sorted.map(e => ({
      timestamp: e.timestamp,
      eventType: e.eventType,
      summary: `${EVENT_LABELS[e.eventType] || e.eventType}${e.source ? ` via ${e.source}` : ''}`,
    }));
  } catch (error) {
    console.error(`[LeadIntel] getEventTimeline failed:`, error);
    return [];
  }
}

/**
 * Get recent activity across all leads, optionally filtered by campaign.
 */
export async function getRecentActivity(campaignId?: string, hours: number = 24): Promise<BehavioralEvent[]> {
  try {
    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;

    const leads = await db.lead.findMany({
      where,
      take: 200,
      orderBy: { updatedAt: 'desc' as const },
    });

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const allEvents: BehavioralEvent[] = [];

    for (const lead of leads) {
      const events = parseEventsFromNotes(lead.notes as string);
      for (const e of events) {
        if (new Date(e.timestamp) >= cutoff) {
          allEvents.push(e);
        }
      }
    }

    return allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('[LeadIntel] getRecentActivity failed:', error);
    return [];
  }
}

// ============================================================
// 2. Behavioral Profile Builder
// ============================================================

/**
 * Build a complete behavioral profile from tracked events.
 * Uses deterministic heuristics with optional LLM enrichment for interests.
 */
export async function buildBehavioralProfile(leadId: string): Promise<BehavioralProfile> {
  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return emptyProfile(leadId);
    }

    const events = parseEventsFromNotes(lead.notes as string);
    const now = new Date();

    // ---- Engagement level ----
    const engagementLevel = calculateEngagementLevel(events, now);

    // ---- Activity trend ----
    const recentActivity = calculateActivityTrend(events, now);

    // ---- Preferred channels ----
    const preferredChannels = derivePreferredChannels(events);

    // ---- Best contact time ----
    const bestContactTime = deriveBestContactTime(events);

    // ---- Activity timeline ----
    const activityTimeline = events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
      .map(e => ({
        timestamp: e.timestamp,
        eventType: e.eventType,
        summary: `${EVENT_LABELS[e.eventType] || e.eventType}${e.source ? ` via ${e.source}` : ''}`,
      }));

    // ---- Top interests (LLM-enriched, with fallback) ----
    let topInterests: string[] = deriveInterestsFallback(events);
    try {
      const llmInterests = await identifyInterests(leadId);
      if (llmInterests && llmInterests.length > 0) {
        topInterests = llmInterests;
      }
    } catch {
      // Keep fallback interests
    }

    return {
      leadId,
      totalEvents: events.length,
      recentActivity,
      engagementLevel,
      topInterests,
      preferredChannels,
      bestContactTime,
      activityTimeline,
    };
  } catch (error) {
    console.error(`[LeadIntel] buildBehavioralProfile failed for ${leadId}:`, error);
    return emptyProfile(leadId);
  }
}

/**
 * Classify engagement level based on event frequency and recency.
 */
export function calculateEngagementLevel(
  events: BehavioralEvent[],
  now: Date = new Date(),
): EngagementLevel {
  if (events.length === 0) return 'cold';

  const lastEvent = events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  const daysSinceLast = daysBetween(new Date(lastEvent.timestamp), now);

  // Cold: no activity in 90+ days
  if (daysSinceLast > 90) return 'cold';

  // Dormant: no activity 30-90 days
  if (daysSinceLast > 30) return 'dormant';

  // Count events in recent windows
  const eventsIn7 = events.filter(e => daysBetween(new Date(e.timestamp), now) <= 7).length;
  const eventsIn14 = events.filter(e => daysBetween(new Date(e.timestamp), now) <= 14).length;
  const eventsIn30 = events.filter(e => daysBetween(new Date(e.timestamp), now) <= 30).length;

  if (eventsIn7 >= 5) return 'highly_engaged';
  if (eventsIn14 >= 3) return 'engaged';
  if (eventsIn30 >= 1) return 'moderately_engaged';

  return 'dormant';
}

/**
 * Calculate activity trend (increasing / stable / decreasing / none).
 */
function calculateActivityTrend(events: BehavioralEvent[], now: Date): ActivityTrend {
  if (events.length < 2) return events.length === 0 ? 'none' : 'stable';

  const last30 = events.filter(e => daysBetween(new Date(e.timestamp), now) <= 30);
  const prev30 = events.filter(e => {
    const d = daysBetween(new Date(e.timestamp), now);
    return d > 30 && d <= 60;
  });

  if (last30.length === 0 && prev30.length === 0) return 'none';
  if (last30.length === 0) return 'decreasing';
  if (prev30.length === 0) return 'increasing';

  const ratio = last30.length / prev30.length;
  if (ratio >= 1.5) return 'increasing';
  if (ratio <= 0.6) return 'decreasing';
  return 'stable';
}

/**
 * Derive preferred channels from event frequency.
 */
function derivePreferredChannels(events: BehavioralEvent[]): string[] {
  const channelCount: Record<string, number> = {};
  for (const e of events) {
    const channel = e.eventType.startsWith('email') ? 'email'
      : e.eventType === 'social_engagement' ? 'social'
      : e.eventType === 'website_visit' ? 'web'
      : e.eventType === 'meeting_scheduled' || e.eventType === 'meeting_completed' ? 'meeting'
      : e.eventType === 'form_submission' ? 'form'
      : e.eventType === 'content_download' ? 'content'
      : 'other';
    channelCount[channel] = (channelCount[channel] || 0) + EVENT_WEIGHTS[e.eventType].weight;
  }

  return Object.entries(channelCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([ch]) => ch);
}

/**
 * Derive the best contact time based on event timestamps.
 * Groups events by hour-of-day and day-of-week to find patterns.
 */
function deriveBestContactTime(events: BehavioralEvent[]): string {
  if (events.length === 0) return 'Tuesday 9:00 AM (default)';

  const hourBuckets: Record<number, number> = {};
  const dayBuckets: Record<number, number> = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (const e of events) {
    const d = new Date(e.timestamp);
    const hour = d.getHours();
    const day = d.getDay();
    const w = EVENT_WEIGHTS[e.eventType].weight;
    hourBuckets[hour] = (hourBuckets[hour] || 0) + w;
    dayBuckets[day] = (dayBuckets[day] || 0) + w;
  }

  const bestHour = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestDay = Object.entries(dayBuckets).sort((a, b) => b[1] - a[1])[0]?.[0];

  const hourNum = bestHour ? parseInt(bestHour, 10) : 9;
  const dayNum = bestDay ? parseInt(bestDay, 10) : 2;
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;

  return `${dayNames[dayNum]} ${displayHour}:00 ${ampm}`;
}

/**
 * Fallback interest derivation from event properties (no LLM).
 */
function deriveInterestsFallback(events: BehavioralEvent[]): string[] {
  const topics: Record<string, number> = {};
  for (const e of events) {
    const props = e.properties || {};

    // Extract from known property keys
    for (const key of ['topic', 'category', 'subject', 'page', 'content_title', 'resource']) {
      if (typeof props[key] === 'string' && props[key].trim()) {
        const val = (props[key] as string).trim();
        topics[val] = (topics[val] || 0) + EVENT_WEIGHTS[e.eventType].weight;
      }
    }

    // High-intent events carry implicit interest
    if (e.eventType === 'proposal_viewed') topics['Pricing / Proposal'] = (topics['Pricing / Proposal'] || 0) + 5;
    if (e.eventType === 'meeting_scheduled') topics['Product Demo'] = (topics['Product Demo'] || 0) + 4;
    if (e.eventType === 'content_download') topics['Educational Content'] = (topics['Educational Content'] || 0) + 3;
  }

  return Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);
}

/**
 * Use LLM to analyze behavioral events and identify key interests/topics.
 */
export async function identifyInterests(leadId: string): Promise<string[] | null> {
  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return null;

    const events = parseEventsFromNotes(lead.notes as string);
    if (events.length === 0) return [];

    // Summarize events for the LLM
    const eventSummaries = events.slice(-30).map(e => ({
      type: e.eventType,
      source: e.source,
      properties: e.properties,
      timestamp: e.timestamp,
    }));

    const systemPrompt = `You are a B2B sales intelligence analyst. Analyze a lead's behavioral events and identify their top interests and topics of interest. Return ONLY a JSON array of strings (max 5 items). Each string should be a concise interest/topic label.`;

    const userMessage = `LEAD: ${(lead as any).companyName || leadId}
EVENTS:
${JSON.stringify(eventSummaries, null, 2)}

What are this lead's top interests? Return a JSON array of 1-5 concise interest labels.`;

    const result = await callLLMForJSON<string[]>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (Array.isArray(result)) {
      return result.slice(0, 5);
    }

    return null;
  } catch (error) {
    console.warn(`[LeadIntel] identifyInterests LLM failed for ${leadId}:`, error);
    return null;
  }
}

/**
 * Analyze when the lead is most likely to engage based on historical patterns.
 * Uses LLM for nuanced analysis with fallback.
 */
export async function predictBestContactTime(leadId: string): Promise<string> {
  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return 'Tuesday 9:00 AM (default)';

    const events = parseEventsFromNotes(lead.notes as string);
    if (events.length < 3) return deriveBestContactTime(events);

    const systemPrompt = `You are a B2B sales optimization analyst. Analyze a lead's engagement timestamps and determine the optimal time to contact them. Return ONLY a JSON object: { "bestDay": "Monday", "bestHour": 9, "bestMinute": 0, "timezone": "UTC", "reasoning": "brief explanation" }`;

    const userMessage = `LEAD: ${(lead as any).companyName || leadId}
TIMESTAMPS (last 30 engagement events):
${events.slice(-30).map(e => e.timestamp).join('\n')}

When is the best time to contact this lead?`;

    const result = await callLLMForJSON<{
      bestDay: string;
      bestHour: number;
      bestMinute: number;
      timezone: string;
      reasoning: string;
    }>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (result && result.bestDay && typeof result.bestHour === 'number') {
      const ampm = result.bestHour >= 12 ? 'PM' : 'AM';
      const displayHour = result.bestHour > 12 ? result.bestHour - 12 : result.bestHour === 0 ? 12 : result.bestHour;
      return `${result.bestDay} ${displayHour}:${String(result.bestMinute || 0).padStart(2, '0')} ${ampm} ${result.timezone || 'UTC'}`;
    }

    return deriveBestContactTime(events);
  } catch (error) {
    console.warn(`[LeadIntel] predictBestContactTime LLM failed for ${leadId}:`, error);
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    const events = parseEventsFromNotes((lead?.notes as string) || null);
    return deriveBestContactTime(events);
  }
}

function emptyProfile(leadId: string): BehavioralProfile {
  return {
    leadId,
    totalEvents: 0,
    recentActivity: 'none',
    engagementLevel: 'cold',
    topInterests: [],
    preferredChannels: [],
    bestContactTime: 'Tuesday 9:00 AM (default)',
    activityTimeline: [],
  };
}

// ============================================================
// 3. Score Decay Engine
// ============================================================

/**
 * Calculate how much a lead's score should decay based on time since
 * last meaningful interaction.
 *
 * Decay model: score reduces by half every `halfLifeDays` of inactivity.
 * Different event types reset the decay clock differently:
 *   - email_open = partial reset (reset 50% of decay)
 *   - meeting / reply / proposal = full reset (reset all decay)
 */
export async function calculateScoreDecay(
  leadId: string,
  currentScore: number,
  config: ScoreDecayConfig = DEFAULT_DECAY_CONFIGS[0],
): Promise<DecayedScore> {
  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return {
        leadId,
        originalScore: currentScore,
        decayedScore: currentScore,
        decayFactor: 1,
        lastActivity: null,
        recommendation: 'Lead not found — no decay applied',
      };
    }

    const events = parseEventsFromNotes(lead.notes as string);
    const now = new Date();

    // Find the most recent "full reset" event
    let lastFullReset: Date | null = null;
    let lastPartialReset: Date | null = null;
    let lastAnyActivity: Date | null = null;

    for (const e of events) {
      const t = new Date(e.timestamp);
      if (!lastAnyActivity || t > lastAnyActivity) lastAnyActivity = t;

      const weight = EVENT_WEIGHTS[e.eventType];
      if (weight.recencyReset === 'full') {
        if (!lastFullReset || t > lastFullReset) lastFullReset = t;
      } else if (weight.recencyReset === 'partial') {
        if (!lastPartialReset || t > lastPartialReset) lastPartialReset = t;
      }
    }

    // Also consider lead timestamp fields as fallback activity signals
    const fallbackDates: Date[] = [];
    for (const field of ['lastContactDate', 'contactedAt', 'qualifiedAt', 'enrichedAt'] as const) {
      const val = (lead as any)[field];
      if (val) {
        const d = typeof val === 'string' ? new Date(val) : val instanceof Date ? val : null;
        if (d && !isNaN(d.getTime())) fallbackDates.push(d);
      }
    }

    // Determine effective last activity for decay calculation
    let effectiveLastActivity: Date;
    if (lastFullReset) {
      effectiveLastActivity = lastFullReset;
    } else if (lastPartialReset) {
      // Partial reset: blend the partial event time with earlier full-reset fallback
      const bestFallback = fallbackDates.sort((a, b) => b.getTime() - a.getTime())[0];
      if (bestFallback && bestFallback > lastPartialReset) {
        effectiveLastActivity = new Date((lastPartialReset.getTime() + bestFallback.getTime()) / 2);
      } else {
        // Use partial reset at 50% effectiveness — shift time forward by 50%
        const halfDecay = daysBetween(lastPartialReset, now) * 0.5;
        effectiveLastActivity = new Date(now.getTime() - halfDecay * 24 * 60 * 60 * 1000);
      }
    } else if (fallbackDates.length > 0) {
      effectiveLastActivity = fallbackDates.sort((a, b) => b.getTime() - a.getTime())[0];
    } else if (lastAnyActivity) {
      effectiveLastActivity = lastAnyActivity;
    } else {
      // No activity at all — use discoveredAt as the baseline
      const discovered = (lead as any).discoveredAt;
      effectiveLastActivity = discovered ? new Date(discovered) : now;
    }

    // Calculate decay
    const daysSinceActivity = Math.max(0, daysBetween(effectiveLastActivity, now));
    const decayFactor = Math.pow(0.5, daysSinceActivity / config.halfLifeDays);
    const decayedScore = Math.round(Math.max(config.minScore, currentScore * decayFactor));

    // Generate recommendation
    let recommendation: string;
    if (decayFactor >= 0.9) {
      recommendation = 'Score is current — no action needed';
    } else if (decayFactor >= 0.7) {
      recommendation = 'Mild decay — consider a touchpoint to refresh engagement';
    } else if (decayFactor >= 0.4) {
      recommendation = 'Significant decay — re-engagement campaign recommended';
    } else if (decayFactor >= 0.2) {
      recommendation = 'Severe decay — attempt re-engagement or move to nurture';
    } else {
      recommendation = 'Near-minimum score — evaluate for removal or aggressive re-engagement';
    }

    return {
      leadId,
      originalScore: currentScore,
      decayedScore,
      decayFactor: Math.round(decayFactor * 100) / 100,
      lastActivity: effectiveLastActivity.toISOString(),
      recommendation,
    };
  } catch (error) {
    console.error(`[LeadIntel] calculateScoreDecay failed for ${leadId}:`, error);
    return {
      leadId,
      originalScore: currentScore,
      decayedScore: currentScore,
      decayFactor: 1,
      lastActivity: null,
      recommendation: 'Error calculating decay — original score retained',
    };
  }
}

/**
 * Apply score decay to all leads in a campaign (or all leads if no campaign).
 * Updates leadScore in DB.
 */
export async function applyScoreDecay(campaignId?: string): Promise<{ updated: number; total: number }> {
  try {
    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;

    // Only decay leads that are not closed
    where.stage = { not: { in: ['closed_won', 'closed_lost'] } };

    const leads = await db.lead.findMany({ where });
    let updated = 0;

    for (const lead of leads) {
      const currentScore = (lead as any).leadScore;
      if (typeof currentScore !== 'number' || currentScore <= 0) continue;

      const decayed = await calculateScoreDecay(lead.id as string, currentScore);

      // Only update if decay is meaningful (>2% change)
      if (decayed.decayedScore !== currentScore && Math.abs(currentScore - decayed.decayedScore) >= Math.max(1, currentScore * 0.02)) {
        try {
          await db.lead.update({
            where: { id: lead.id as string },
            data: { leadScore: decayed.decayedScore },
          });
          updated++;
        } catch (err) {
          console.warn(`[LeadIntel] applyScoreDecay: failed to update lead ${lead.id}:`, err);
        }
      }
    }

    return { updated, total: leads.length };
  } catch (error) {
    console.error('[LeadIntel] applyScoreDecay failed:', error);
    return { updated: 0, total: 0 };
  }
}

/**
 * Get a report showing which leads have decayed most.
 */
export async function getDecayReport(campaignId?: string): Promise<DecayedScore[]> {
  try {
    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;

    const leads = await db.lead.findMany({
      where,
      orderBy: { leadScore: 'asc' as const },
      take: 100,
    });

    const report: DecayedScore[] = [];
    for (const lead of leads) {
      const score = (lead as any).leadScore;
      if (typeof score !== 'number') continue;

      const decayed = await calculateScoreDecay(lead.id as string, score);
      report.push(decayed);
    }

    // Sort by most decayed (lowest decayFactor) first
    return report.sort((a, b) => a.decayFactor - b.decayFactor);
  } catch (error) {
    console.error('[LeadIntel] getDecayReport failed:', error);
    return [];
  }
}

/**
 * Find leads whose scores have decayed significantly but might be re-engageable.
 * Criteria: decayed score < 40% of original but > minScore, and some past engagement.
 */
export async function identifyReEngagementTargets(campaignId?: string): Promise<DecayedScore[]> {
  try {
    const report = await getDecayReport(campaignId);
    return report.filter(r =>
      r.decayFactor < 0.4 &&
      r.decayedScore > 5 &&
      r.lastActivity !== null
    );
  } catch (error) {
    console.error('[LeadIntel] identifyReEngagementTargets failed:', error);
    return [];
  }
}

// ============================================================
// 4. Predictive Scoring (AI-powered)
// ============================================================

/**
 * Use LLM to predict conversion probability based on:
 * behavioral profile, ICP fit, engagement history, deal velocity, timing signals.
 */
export async function predictConversionProbability(leadId: string): Promise<PredictiveScore> {
  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return emptyPredictiveScore(leadId);

    // Gather all available signals
    const profile = await buildBehavioralProfile(leadId);
    const decay = await calculateScoreDecay(leadId, (lead as any).leadScore || 0);

    const leadData = {
      leadScore: (lead as any).leadScore,
      leadTier: (lead as any).leadTier,
      stage: (lead as any).stage,
      firmographicScore: (lead as any).firmographicScore,
      intentScore: (lead as any).intentScore,
      reachabilityScore: (lead as any).reachabilityScore,
      strategicScore: (lead as any).strategicScore,
      dataCompleteness: (lead as any).dataCompleteness,
      companyName: (lead as any).companyName,
      industry: (lead as any).industry,
      lastContactDate: (lead as any).lastContactDate,
      behavioralProfile: {
        engagementLevel: profile.engagementLevel,
        totalEvents: profile.totalEvents,
        recentActivity: profile.recentActivity,
        topInterests: profile.topInterests,
      },
      scoreDecay: {
        decayFactor: decay.decayFactor,
        lastActivity: decay.lastActivity,
      },
    };

    const systemPrompt = `You are an expert B2B sales forecasting model. Analyze the lead data below and predict conversion probability, deal size, and close date. Also identify key positive/negative factors and risk factors.

Return ONLY valid JSON with this exact structure:
{
  "conversionProbability": 0.0-1.0,
  "estimatedDealSize": number (in USD),
  "estimatedCloseDate": "YYYY-MM-DD",
  "confidenceLevel": 0.0-1.0,
  "keyFactors": [
    { "factor": "string", "impact": "positive|negative|neutral", "weight": 0.0-1.0, "description": "string" }
  ],
  "riskFactors": ["string"]
}`;

    const userMessage = `LEAD DATA:
${JSON.stringify(leadData, null, 2)}

Provide your predictive analysis as the specified JSON.`;

    const result = await callLLMForJSON<PredictiveScore>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (result && typeof result.conversionProbability === 'number') {
      return {
        leadId,
        conversionProbability: clamp(result.conversionProbability, 0, 1),
        estimatedDealSize: Math.max(0, result.estimatedDealSize || 0),
        estimatedCloseDate: result.estimatedCloseDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        confidenceLevel: clamp(result.confidenceLevel || 0.5, 0, 1),
        keyFactors: Array.isArray(result.keyFactors)
          ? result.keyFactors.slice(0, 8).map((f: any) => ({
              factor: String(f.factor || 'Unknown'),
              impact: (['positive', 'negative', 'neutral'].includes(f.impact) ? f.impact : 'neutral') as FactorImpact,
              weight: clamp(Number(f.weight) || 0.5, 0, 1),
              description: String(f.description || ''),
            }))
          : [],
        riskFactors: Array.isArray(result.riskFactors) ? result.riskFactors.map(String) : [],
      };
    }

    // Fallback to heuristic prediction
    return heuristicPredictiveScore(leadId, leadData);
  } catch (error) {
    console.warn(`[LeadIntel] predictConversionProbability LLM failed for ${leadId}:`, error);
    try {
      const lead = await db.lead.findUnique({ where: { id: leadId } });
      return heuristicPredictiveScore(leadId, lead || {});
    } catch {
      return emptyPredictiveScore(leadId);
    }
  }
}

/**
 * Estimate likely deal size based on company size, industry, and behavioral signals.
 */
export async function predictDealSize(leadData: Record<string, unknown>): Promise<number> {
  // Heuristic baseline
  const base = heuristicDealSize(leadData);

  try {
    const systemPrompt = `You are a B2B deal sizing expert. Estimate the likely deal size for this lead. Return ONLY a JSON object: { "estimatedDealSize": number (USD), "reasoning": "string" }`;

    const userMessage = `LEAD DATA:
${JSON.stringify(leadData, null, 2)}

What is the estimated deal size?`;

    const result = await callLLMForJSON<{ estimatedDealSize: number; reasoning: string }>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (result && typeof result.estimatedDealSize === 'number' && result.estimatedDealSize > 0) {
      return result.estimatedDealSize;
    }
  } catch {
    // Fall through to heuristic
  }

  return base;
}

/**
 * Estimate likely close date based on pipeline stage, velocity, and engagement.
 */
export async function predictCloseDate(leadId: string): Promise<string> {
  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const events = parseEventsFromNotes(lead.notes as string);
    const stage = (lead as any).stage as string;

    // Heuristic baseline
    const baselineDays = stageToDays(stage, events);

    try {
      const systemPrompt = `You are a B2B pipeline velocity analyst. Estimate the likely close date for this lead. Return ONLY a JSON object: { "estimatedCloseDate": "YYYY-MM-DD", "reasoning": "string" }`;

      const userMessage = `LEAD:
- Stage: ${stage}
- Company: ${(lead as any).companyName || 'Unknown'}
- Last Contact: ${(lead as any).lastContactDate || 'Unknown'}
- Lead Score: ${(lead as any).leadScore || 0}
- Total Events: ${events.length}
- Last Event: ${events.length > 0 ? events[events.length - 1].timestamp : 'None'}

When will this deal likely close?`;

      const result = await callLLMForJSON<{ estimatedCloseDate: string; reasoning: string }>(systemPrompt, userMessage, {
        temperature: 0.3,
        retriesPerModel: 2,
        useFallback: true,
      });

      if (result && result.estimatedCloseDate && /^\d{4}-\d{2}-\d{2}$/.test(result.estimatedCloseDate)) {
        return result.estimatedCloseDate;
      }
    } catch {
      // Fall through to heuristic
    }

    return new Date(Date.now() + baselineDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  } catch (error) {
    console.warn(`[LeadIntel] predictCloseDate failed for ${leadId}:`, error);
    return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
}

/**
 * Get predictions for all active leads in a campaign.
 */
export async function getPipelinePredictions(campaignId?: string): Promise<PredictiveScore[]> {
  try {
    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;

    // Only predict for active pipeline leads
    where.stage = { not: { in: ['closed_won', 'closed_lost', 'new'] } };

    const leads = await db.lead.findMany({ where, take: 50 });

    const predictions: PredictiveScore[] = [];
    for (const lead of leads) {
      try {
        const pred = await predictConversionProbability(lead.id as string);
        predictions.push(pred);
      } catch {
        predictions.push(emptyPredictiveScore(lead.id as string));
      }
    }

    return predictions.sort((a, b) => b.conversionProbability - a.conversionProbability);
  } catch (error) {
    console.error('[LeadIntel] getPipelinePredictions failed:', error);
    return [];
  }
}

// ---- Predictive scoring helpers / fallbacks ----

function heuristicPredictiveScore(leadId: string, leadData: Record<string, any>): PredictiveScore {
  const score = typeof leadData.leadScore === 'number' ? leadData.leadScore : 50;
  const stage = leadData.stage || 'new';
  const engagementLevel = leadData.behavioralProfile?.engagementLevel || 'cold';

  // Base conversion probability on score + stage + engagement
  let prob = score / 200; // base: 0-0.5
  const stageMultiplier: Record<string, number> = {
    new: 0.1, enriched: 0.15, qualified: 0.25, contacted: 0.3,
    engaged: 0.5, negotiating: 0.7, closed_won: 1.0, closed_lost: 0, nurture: 0.1,
  };
  prob += (stageMultiplier[stage] || 0.2) * 0.3;

  const engagementMultiplier: Record<string, number> = {
    highly_engaged: 0.2, engaged: 0.1, moderately_engaged: 0, dormant: -0.1, cold: -0.15,
  };
  prob += engagementMultiplier[engagementLevel] || 0;

  prob = clamp(prob, 0, 1);

  const dealSize = heuristicDealSize(leadData);

  // Close date based on stage
  const daysToClose = stageToDays(stage, []);
  const closeDate = new Date(Date.now() + daysToClose * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const keyFactors: ScoreFactor[] = [];
  if (score >= 70) keyFactors.push({ factor: 'High lead score', impact: 'positive', weight: 0.3, description: `Lead score of ${score} indicates strong fit` });
  else if (score < 30) keyFactors.push({ factor: 'Low lead score', impact: 'negative', weight: 0.3, description: `Lead score of ${score} indicates weak fit` });

  if (engagementLevel === 'highly_engaged' || engagementLevel === 'engaged') {
    keyFactors.push({ factor: 'Strong engagement', impact: 'positive', weight: 0.25, description: `Lead is ${engagementLevel}` });
  } else if (engagementLevel === 'dormant' || engagementLevel === 'cold') {
    keyFactors.push({ factor: 'Low engagement', impact: 'negative', weight: 0.25, description: `Lead is ${engagementLevel}` });
  }

  if (leadData.scoreDecay?.decayFactor < 0.5) {
    keyFactors.push({ factor: 'Score decay', impact: 'negative', weight: 0.2, description: `Score has decayed to ${Math.round(leadData.scoreDecay.decayFactor * 100)}% of original` });
  }

  const riskFactors: string[] = [];
  if (engagementLevel === 'dormant' || engagementLevel === 'cold') riskFactors.push('Low engagement may indicate lost interest');
  if (leadData.scoreDecay?.decayFactor < 0.3) riskFactors.push('Severe score decay — lead may no longer be viable');
  if (stage === 'nurture') riskFactors.push('Lead is in nurture — low short-term conversion probability');

  return {
    leadId,
    conversionProbability: Math.round(prob * 100) / 100,
    estimatedDealSize: dealSize,
    estimatedCloseDate: closeDate,
    confidenceLevel: clamp(0.4 + (score / 200), 0.1, 0.9),
    keyFactors,
    riskFactors,
  };
}

function heuristicDealSize(leadData: Record<string, any>): number {
  const employeeCount = leadData.employeeCount || leadData.companySize || '';
  const sizeMap: Record<string, number> = {
    '1-10': 5000, '11-50': 15000, '51-200': 35000,
    '201-500': 75000, '501-1000': 150000, '1001-5000': 300000, '5000+': 500000,
  };
  const base = sizeMap[employeeCount] || 25000;

  // Adjust by industry and stage
  const industryMultiplier = typeof leadData.industry === 'string' && ['Technology', 'Finance', 'Healthcare', 'Pharmaceuticals'].some(i => (leadData.industry as string).includes(i))
    ? 1.5 : 1.0;

  const stageMultiplier: Record<string, number> = {
    negotiating: 1.3, engaged: 1.1, qualified: 1.0,
    contacted: 0.9, enriched: 0.8, new: 0.7, nurture: 0.6,
  };
  const sm = stageMultiplier[leadData.stage] || 1.0;

  return Math.round(base * industryMultiplier * sm);
}

function stageToDays(stage: string, events: BehavioralEvent[]): number {
  // Estimate days to close based on current stage
  const baseDays: Record<string, number> = {
    new: 180, enriched: 150, qualified: 120, contacted: 90,
    engaged: 60, negotiating: 30, closed_won: 0, closed_lost: 0, nurture: 200,
  };
  let days = baseDays[stage] || 120;

  // Adjust by engagement velocity: if many recent events, shorten
  if (events.length > 10) days = Math.round(days * 0.8);
  if (events.length > 20) days = Math.round(days * 0.7);

  return Math.max(7, days);
}

function emptyPredictiveScore(leadId: string): PredictiveScore {
  return {
    leadId,
    conversionProbability: 0,
    estimatedDealSize: 0,
    estimatedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    confidenceLevel: 0,
    keyFactors: [],
    riskFactors: ['Insufficient data for prediction'],
  };
}

// ============================================================
// 5. Intelligence Alerts
// ============================================================

/**
 * Use LLM to generate intelligence alerts for a lead based on behavioral
 * changes, score decay, and predictive signals.
 */
export async function generateAlerts(leadId: string): Promise<IntelligenceAlert[]> {
  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return [];

    const profile = await buildBehavioralProfile(leadId);
    const decay = await calculateScoreDecay(leadId, (lead as any).leadScore || 0);
    const prediction = await predictConversionProbability(leadId);

    // ---- Generate deterministic alerts first (always present) ----
    const deterministicAlerts: IntelligenceAlert[] = [];

    // Engagement spike: 3+ events in last 3 days
    const events3d = profile.activityTimeline.filter(
      t => daysBetween(new Date(t.timestamp), new Date()) <= 3
    );
    if (events3d.length >= 3 && (profile.engagementLevel === 'highly_engaged' || profile.engagementLevel === 'engaged')) {
      deterministicAlerts.push({
        id: generateId(),
        leadId,
        alertType: 'engagement_spike',
        severity: 'high',
        title: 'Engagement Spike Detected',
        description: `${events3d.length} interactions in the last 3 days. Lead engagement is surging.`,
        actionRequired: 'Reach out immediately while interest is high. Prioritize personalized follow-up.',
        createdAt: new Date().toISOString(),
      });
    }

    // Engagement drop: was engaged, now dormant/cold
    if (profile.recentActivity === 'decreasing' && (profile.engagementLevel === 'dormant' || profile.engagementLevel === 'cold')) {
      deterministicAlerts.push({
        id: generateId(),
        leadId,
        alertType: 'engagement_drop',
        severity: 'high',
        title: 'Engagement Drop Detected',
        description: `Lead activity is decreasing and engagement level is ${profile.engagementLevel}.`,
        actionRequired: 'Attempt re-engagement with a value-driven message. Consider a different channel or angle.',
        createdAt: new Date().toISOString(),
      });
    }

    // Score decay warning
    if (decay.decayFactor < 0.5 && decay.originalScore > 40) {
      deterministicAlerts.push({
        id: generateId(),
        leadId,
        alertType: 'score_decay_warning',
        severity: decay.decayFactor < 0.25 ? 'critical' : 'high',
        title: 'Significant Score Decay',
        description: `Lead score has decayed to ${decayedScorePercent(decay)} of original (${decay.originalScore} → ${decay.decayedScore}).`,
        actionRequired: 'Evaluate for re-engagement or move to long-term nurture.',
        createdAt: new Date().toISOString(),
      });
    }

    // High-intent signal: meeting completed or proposal viewed
    const recentHighIntent = profile.activityTimeline.filter(
      t => (t.eventType === 'meeting_completed' || t.eventType === 'proposal_viewed')
        && daysBetween(new Date(t.timestamp), new Date()) <= 7
    );
    if (recentHighIntent.length > 0) {
      deterministicAlerts.push({
        id: generateId(),
        leadId,
        alertType: 'high_intent_signal',
        severity: 'high',
        title: 'High-Intent Signal',
        description: `Lead has ${recentHighIntent.map(t => t.eventType.replace('_', ' ')).join(' and ')} in the last 7 days.`,
        actionRequired: 'Escalate to sales team. This lead is showing strong buying signals.',
        createdAt: new Date().toISOString(),
      });
    }

    // At-risk deal: was in negotiating/engaged but engagement dropped
    const stage = (lead as any).stage as string;
    if ((stage === 'negotiating' || stage === 'engaged') && (profile.engagementLevel === 'dormant' || profile.engagementLevel === 'cold' || profile.recentActivity === 'decreasing')) {
      deterministicAlerts.push({
        id: generateId(),
        leadId,
        alertType: 'at_risk_deal',
        severity: 'critical',
        title: 'Deal at Risk',
        description: `Lead is in ${stage} stage but engagement is ${profile.engagementLevel} and trending ${profile.recentActivity}.`,
        actionRequired: 'Urgent outreach needed. Consider executive involvement or alternative value proposition.',
        createdAt: new Date().toISOString(),
      });
    }

    // Re-engagement opportunity: decayed but still some activity
    if (decay.decayFactor < 0.4 && decay.decayFactor > 0.1 && profile.totalEvents > 3) {
      deterministicAlerts.push({
        id: generateId(),
        leadId,
        alertType: 're_engagement_opportunity',
        severity: 'medium',
        title: 'Re-Engagement Opportunity',
        description: `Lead score has decayed significantly (${decay.decayedScore}) but has ${profile.totalEvents} past interactions. May be re-engageable.`,
        actionRequired: 'Try a fresh approach with new value proposition or relevant content.',
        createdAt: new Date().toISOString(),
      });
    }

    // ---- LLM-enriched alerts (supplementary) ----
    let llmAlerts: IntelligenceAlert[] = [];
    try {
      const systemPrompt = `You are a B2B sales intelligence analyst. Based on the lead data below, identify any additional intelligence alerts that a sales team should know about. Focus on patterns not covered by basic rules.

Return ONLY a JSON array of alert objects:
[
  {
    "alertType": "engagement_spike|engagement_drop|score_decay_warning|high_intent_signal|at_risk_deal|re_engagement_opportunity",
    "severity": "critical|high|medium|low",
    "title": "string",
    "description": "string",
    "actionRequired": "string"
  }
]

If no additional alerts are needed, return an empty array: []`;

      const userMessage = `LEAD DATA:
- Stage: ${stage}
- Score: ${(lead as any).leadScore}
- Engagement: ${profile.engagementLevel}
- Activity Trend: ${profile.recentActivity}
- Total Events: ${profile.totalEvents}
- Decay Factor: ${decay.decayFactor}
- Conversion Probability: ${prediction.conversionProbability}
- Key Risk Factors: ${prediction.riskFactors.join(', ')}
- Top Interests: ${profile.topInterests.join(', ')}
- Recent Timeline: ${profile.activityTimeline.slice(0, 5).map(t => t.summary).join('; ')}

What additional alerts should be raised?`;

      const result = await callLLMForJSON<Array<{
        alertType: AlertType;
        severity: AlertSeverity;
        title: string;
        description: string;
        actionRequired: string;
      }>>(systemPrompt, userMessage, {
        temperature: 0.3,
        retriesPerModel: 2,
        useFallback: true,
      });

      if (Array.isArray(result)) {
        llmAlerts = result.map(a => ({
          id: generateId(),
          leadId,
          alertType: a.alertType,
          severity: a.severity,
          title: a.title,
          description: a.description,
          actionRequired: a.actionRequired,
          createdAt: new Date().toISOString(),
        }));
      }
    } catch {
      // LLM enrichment failed — continue with deterministic alerts only
    }

    const allAlerts = [...deterministicAlerts, ...llmAlerts];

    // Persist alerts in lead notes
    if (allAlerts.length > 0) {
      try {
        const existingNotes = (lead.notes as string) || null;
        const existingAlerts = parseAlertsFromNotes(existingNotes);
        const merged = [...existingAlerts, ...allAlerts];
        const updatedNotes = buildNotesWithAlerts(existingNotes, merged);

        await db.lead.update({
          where: { id: leadId },
          data: { notes: updatedNotes },
        });
      } catch (err) {
        console.warn(`[LeadIntel] generateAlerts: failed to persist alerts for ${leadId}:`, err);
      }
    }

    return allAlerts;
  } catch (error) {
    console.error(`[LeadIntel] generateAlerts failed for ${leadId}:`, error);
    return [];
  }
}

function decayedScorePercent(decay: DecayedScore): string {
  return `${Math.round(decay.decayFactor * 100)}%`;
}

/**
 * Get all active (non-dismissed) alerts for leads in a campaign.
 */
export async function getActiveAlerts(campaignId?: string): Promise<IntelligenceAlert[]> {
  try {
    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;

    const leads = await db.lead.findMany({ where, take: 200 });
    const allAlerts: IntelligenceAlert[] = [];

    for (const lead of leads) {
      const alerts = parseAlertsFromNotes(lead.notes as string);
      // Filter out dismissed alerts
      const active = alerts.filter(a => !(a as any).dismissedAt);
      allAlerts.push(...active);
    }

    // Sort by severity then date
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return allAlerts.sort((a, b) => {
      const sevDiff = (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error('[LeadIntel] getActiveAlerts failed:', error);
    return [];
  }
}

/**
 * Dismiss an alert by marking it as dismissed in the lead's notes.
 */
export async function dismissAlert(alertId: string): Promise<boolean> {
  try {
    // We need to find which lead contains this alert
    // Since alerts are stored in lead notes, we search recent leads
    const leads = await db.lead.findMany({ take: 500 });

    for (const lead of leads) {
      const alerts = parseAlertsFromNotes(lead.notes as string);
      const target = alerts.find(a => a.id === alertId);
      if (target) {
        // Mark as dismissed
        (target as any).dismissedAt = new Date().toISOString();

        const existingNotes = (lead.notes as string) || null;
        const updatedNotes = buildNotesWithAlerts(existingNotes, alerts);

        await db.lead.update({
          where: { id: lead.id as string },
          data: { notes: updatedNotes },
        });

        return true;
      }
    }

    console.warn(`[LeadIntel] dismissAlert: alert ${alertId} not found`);
    return false;
  } catch (error) {
    console.error(`[LeadIntel] dismissAlert failed for ${alertId}:`, error);
    return false;
  }
}

// ============================================================
// 6. Composite Intelligence Score
// ============================================================

/**
 * Combine all intelligence signals into a single composite score.
 *
 * Weights:
 *   BANT          20%
 *   MEDDIC        20%
 *   ICP Fit       15%
 *   Behavioral    20%
 *   Predictive    15%
 *   Data Quality  10%
 */
export async function calculateCompositeScore(leadId: string): Promise<CompositeScoreResult> {
  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return {
        leadId,
        compositeScore: 0,
        tier: 'unqualified',
        breakdown: { bant: 0, meddic: 0, icpFit: 0, behavioral: 0, predictive: 0, dataQuality: 0 },
        recommendation: 'Lead not found',
        updatedAt: new Date().toISOString(),
      };
    }

    // ---- BANT score (from existing scoring fields) ----
    const bantScore = estimateBANTFromLead(lead);

    // ---- MEDDIC score (from existing scoring fields) ----
    const meddicScore = estimateMEDDICFromLead(lead);

    // ---- ICP Fit (from firmographic + intent + strategic scores) ----
    const icpFitScore = estimateICPFit(lead);

    // ---- Behavioral score (from profile) ----
    const profile = await buildBehavioralProfile(leadId);
    const behavioralScore = calculateBehavioralScore(profile);

    // ---- Predictive score (from LLM prediction) ----
    const prediction = await predictConversionProbability(leadId);
    const predictiveScore = Math.round(prediction.conversionProbability * 100);

    // ---- Data Quality score ----
    const dataQualityScore = calculateDataQuality(lead);

    // ---- Weighted composite ----
    const breakdown = {
      bant: bantScore,
      meddic: meddicScore,
      icpFit: icpFitScore,
      behavioral: behavioralScore,
      predictive: predictiveScore,
      dataQuality: dataQualityScore,
    };

    const compositeScore = Math.round(
      bantScore * COMPOSITE_WEIGHTS.bant +
      meddicScore * COMPOSITE_WEIGHTS.meddic +
      icpFitScore * COMPOSITE_WEIGHTS.icpFit +
      behavioralScore * COMPOSITE_WEIGHTS.behavioral +
      predictiveScore * COMPOSITE_WEIGHTS.predictive +
      dataQualityScore * COMPOSITE_WEIGHTS.dataQuality
    );

    const tier = compositeScore >= 70 ? 'hot' : compositeScore >= 45 ? 'warm' : compositeScore >= 25 ? 'cold' : 'unqualified';
    const recommendation = generateCompositeRecommendation(compositeScore, breakdown, profile);

    return {
      leadId,
      compositeScore: clamp(compositeScore, 0, 100),
      tier,
      breakdown,
      recommendation,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[LeadIntel] calculateCompositeScore failed for ${leadId}:`, error);
    return {
      leadId,
      compositeScore: 0,
      tier: 'unqualified',
      breakdown: { bant: 0, meddic: 0, icpFit: 0, behavioral: 0, predictive: 0, dataQuality: 0 },
      recommendation: 'Error calculating composite score',
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Update all lead scores with composite scoring.
 * Persists the composite score as the lead's leadScore.
 */
export async function updateLeadScores(campaignId?: string): Promise<{ updated: number; total: number }> {
  try {
    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;

    const leads = await db.lead.findMany({
      where,
      orderBy: { leadScore: 'desc' as const },
      take: 200,
    });

    let updated = 0;

    for (const lead of leads) {
      try {
        const result = await calculateCompositeScore(lead.id as string);

        // Determine new tier
        const newTier = result.tier;

        await db.lead.update({
          where: { id: lead.id as string },
          data: {
            leadScore: result.compositeScore,
            leadTier: newTier,
          },
        });

        updated++;
      } catch (err) {
        console.warn(`[LeadIntel] updateLeadScores: failed for lead ${lead.id}:`, err);
      }
    }

    return { updated, total: leads.length };
  } catch (error) {
    console.error('[LeadIntel] updateLeadScores failed:', error);
    return { updated: 0, total: 0 };
  }
}

// ---- Composite score helpers ----

/**
 * Estimate BANT score from lead data fields.
 * Maps firmographicScore → Budget, strategicScore → Authority,
 * intentScore → Need, reachabilityScore → Timeline.
 */
function estimateBANTFromLead(lead: Record<string, any>): number {
  const budget = typeof lead.firmographicScore === 'number' ? lead.firmographicScore : 50;
  const authority = typeof lead.strategicScore === 'number' ? lead.strategicScore : 50;
  const need = typeof lead.intentScore === 'number' ? lead.intentScore : 50;
  const timeline = typeof lead.reachabilityScore === 'number' ? lead.reachabilityScore : 50;

  // BANT is 0-100 where each dimension is 0-25
  // Our sub-scores are 0-100, so normalize
  return Math.round((budget / 4) + (authority / 4) + (need / 4) + (timeline / 4));
}

/**
 * Estimate MEDDIC score from lead data.
 * Uses available scoring fields as proxies for MEDDIC dimensions.
 */
function estimateMEDDICFromLead(lead: Record<string, any>): number {
  // Use a weighted combination of existing scores as MEDDIC proxies
  const firmographic = typeof lead.firmographicScore === 'number' ? lead.firmographicScore : 50;
  const intent = typeof lead.intentScore === 'number' ? lead.intentScore : 50;
  const reachability = typeof lead.reachabilityScore === 'number' ? lead.reachabilityScore : 50;
  const strategic = typeof lead.strategicScore === 'number' ? lead.strategicScore : 50;

  // Map to MEDDIC: Metrics(20%), EconomicBuyer(20%), DecisionCriteria(15%),
  // DecisionProcess(15%), IdentifyPain(15%), Champion(15%)
  return Math.round(
    firmographic * 0.20 +
    strategic * 0.20 +
    intent * 0.15 +
    reachability * 0.15 +
    intent * 0.15 +
    strategic * 0.15
  );
}

/**
 * Estimate ICP Fit from firmographic and intent scores.
 */
function estimateICPFit(lead: Record<string, any>): number {
  const firmographic = typeof lead.firmographicScore === 'number' ? lead.firmographicScore : 50;
  const intent = typeof lead.intentScore === 'number' ? lead.intentScore : 50;
  const strategic = typeof lead.strategicScore === 'number' ? lead.strategicScore : 50;

  return Math.round(firmographic * 0.4 + intent * 0.35 + strategic * 0.25);
}

/**
 * Calculate behavioral score from profile.
 * Maps engagement level and activity to a 0-100 score.
 */
function calculateBehavioralScore(profile: BehavioralProfile): number {
  const engagementScores: Record<EngagementLevel, number> = {
    highly_engaged: 90,
    engaged: 70,
    moderately_engaged: 45,
    dormant: 20,
    cold: 5,
  };

  const trendBonus: Record<ActivityTrend, number> = {
    increasing: 10,
    stable: 0,
    decreasing: -10,
    none: -5,
  };

  let score = engagementScores[profile.engagementLevel] || 0;
  score += trendBonus[profile.recentActivity] || 0;

  // Bonus for event volume
  if (profile.totalEvents > 20) score += 5;
  if (profile.totalEvents > 50) score += 5;

  return clamp(Math.round(score), 0, 100);
}

/**
 * Calculate data quality score from lead fields.
 * Checks how many key fields are populated.
 */
function calculateDataQuality(lead: Record<string, any>): number {
  const importantFields = [
    'companyName', 'industry', 'employeeCount', 'city', 'country',
    'website', 'keyContactName', 'keyContactEmail', 'keyContactTitle',
    'leadScore', 'leadTier', 'stage',
  ];

  let filled = 0;
  for (const field of importantFields) {
    const val = lead[field];
    if (val !== null && val !== undefined && val !== '' && val !== 0) {
      filled++;
    }
  }

  // Also check dataCompleteness if available
  const dc = typeof lead.dataCompleteness === 'number' ? lead.dataCompleteness : null;

  if (dc !== null) {
    // Blend field-level check with existing dataCompleteness
    return Math.round((dc + (filled / importantFields.length) * 100) / 2);
  }

  return Math.round((filled / importantFields.length) * 100);
}

/**
 * Generate a recommendation based on composite score and breakdown.
 */
function generateCompositeRecommendation(
  compositeScore: number,
  breakdown: CompositeScoreResult['breakdown'],
  profile: BehavioralProfile,
): string {
  const parts: string[] = [];

  // Identify strongest and weakest areas
  const entries = Object.entries(breakdown) as [string, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const strongest = sorted.slice(0, 2).map(([k]) => k);
  const weakest = sorted.slice(-2).filter(([_, v]) => v < 40).map(([k]) => k);

  if (compositeScore >= 70) {
    parts.push('High-priority lead — pursue immediately');
    parts.push(`Strongest signals: ${strongest.join(', ')}`);
  } else if (compositeScore >= 45) {
    parts.push('Good potential lead — active nurturing recommended');
    if (weakest.length > 0) parts.push(`Needs improvement in: ${weakest.join(', ')}`);
  } else if (compositeScore >= 25) {
    parts.push('Low-priority lead — add to long-term nurture');
    if (weakest.length > 0) parts.push(`Significant gaps in: ${weakest.join(', ')}`);
  } else {
    parts.push('Unqualified at this time — consider disqualifying or deprioritizing');
  }

  // Behavioral context
  if (profile.engagementLevel === 'highly_engaged' || profile.engagementLevel === 'engaged') {
    parts.push('Lead is actively engaging — time-sensitive opportunity');
  } else if (profile.engagementLevel === 'dormant' || profile.engagementLevel === 'cold') {
    parts.push('Engagement is low — re-engagement strategy needed');
  }

  if (profile.recentActivity === 'increasing') {
    parts.push('Activity trend is positive — momentum building');
  } else if (profile.recentActivity === 'decreasing') {
    parts.push('Activity trend is declining — intervention may be needed');
  }

  return parts.join('. ') + '.';
}
