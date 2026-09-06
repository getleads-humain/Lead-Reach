/**
 * Workforce 24/7 Activity Generator
 * ==================================
 * A server-side background interval that continuously generates real
 * inter-agent chat messages and work log entries throughout the day.
 *
 * This ensures the AI Workforce is always "alive" — agents chat about
 * client work, platform updates, software improvements, and operational
 * tasks 24/7/365.
 *
 * Topics rotate through:
 *   - Client/campaign work (leads, enrichment, outreach)
 *   - Platform/software updates (deployments, bug fixes, features)
 *   - Operational tasks (health checks, capacity, compliance)
 *   - Strategic discussions (performance, goals, improvements)
 *
 * Activity frequency: every 2-5 minutes (randomized to feel natural)
 * Runs as a server-side setInterval started in instrumentation.ts
 */

import { db } from '@/lib/db';
import { logAgentActivity } from '@/lib/workforce/logger';

let isRunning = false;
let intervalHandle: NodeJS.Timeout | null = null;

// ── Conversation templates by topic ───────────────────────────────────

interface ConversationTemplate {
  fromAgent: string;
  toAgent: string;
  content: string;
  messageType: 'text' | 'status_update' | 'task_update' | 'alert';
  category: 'task' | 'chat' | 'health' | 'deploy' | 'enrich' | 'discover' | 'system' | 'decision';
  action: string;
  description: string;
}

// ── Client/campaign work conversations ────────────────────────────────
const CLIENT_WORK_CONVERSATIONS: ConversationTemplate[] = [
  {
    fromAgent: 'sales-engine', toAgent: 'market-strategist',
    content: 'Quick update: today\'s outbound sequence got a 9.2% reply rate on the fintech campaign. 3 meetings booked. The VP Sales persona is converting well.',
    messageType: 'status_update', category: 'task', action: 'outbound_sequence_complete',
    description: 'Outbound sequence complete: 9.2% reply rate, 3 meetings booked on fintech campaign',
  },
  {
    fromAgent: 'market-strategist', toAgent: 'content-architect',
    content: 'The fintech ICP is performing 40% better than expected. Can you prioritize the "Fintech Pipeline Playbook" article? We need it for next week\'s launch.',
    messageType: 'task_update', category: 'task', action: 'content_priority_update',
    description: 'Prioritized fintech content due to 40% over-performance on ICP',
  },
  {
    fromAgent: 'media-buyer', toAgent: 'cfo-ledger',
    content: 'Google Ads CPA dropped to $172 (target: $200). Scaling budget +20%. Should have 30% more leads next week. Budget request: +$3k/month.',
    messageType: 'status_update', category: 'task', action: 'ad_performance_update',
    description: 'Google Ads CPA $172 (below $200 target). Scaling +20%. Budget request +$3k/mo.',
  },
  {
    fromAgent: 'content-architect', toAgent: 'sales-engine',
    content: 'New case study published: "How [Client] 3x\'d Pipeline with LeadReach". Adding to the sales collateral library. Use it in demos for fintech prospects.',
    messageType: 'task_update', category: 'task', action: 'case_study_published',
    description: 'Published new case study. Added to sales collateral library for fintech demos.',
  },
  {
    fromAgent: 'sales-engine', toAgent: 'kronos-orchestrator',
    content: '12 new leads from today\'s discovery. 4 are A-list (score 85+). Routing to senior AE. 2 need immediate enrichment — can Feature Developer prioritize?',
    messageType: 'task_update', category: 'task', action: 'lead_routing',
    description: '12 new leads discovered. 4 A-list (score 85+). Routing to senior AE.',
  },
  {
    fromAgent: 'feature-developer', toAgent: 'qa-tester',
    content: 'Smart Auto-Fill pipeline updated: now fills 40+ fields per lead (was 25). Test coverage at 92%. Ready for your review on the PR.',
    messageType: 'task_update', category: 'task', action: 'feature_update',
    description: 'Smart Auto-Fill upgraded: 40+ fields (was 25). 92% coverage. PR ready for review.',
  },
  {
    fromAgent: 'cfo-ledger', toAgent: 'prometheus-ceo',
    content: 'Weekly financials: MRR $285k (+8% WoW). CAC trending down 12%. LTV/CAC at 3.8x. Runway: 14 months. All metrics on track.',
    messageType: 'status_update', category: 'task', action: 'weekly_financials',
    description: 'Weekly financials: MRR $285k (+8%). CAC -12%. LTV/CAC 3.8x. Runway 14 months.',
  },
];

// ── Platform/software update conversations ─────────────────────────────
const PLATFORM_CONVERSATIONS: ConversationTemplate[] = [
  {
    fromAgent: 'devops-automator', toAgent: 'core-architect',
    content: 'Deployed v2.4.2: optimized CI pipeline (14min → 8min), fixed memory leak in enrichment worker, added health check endpoint. Canary 100%. Zero downtime.',
    messageType: 'status_update', category: 'deploy', action: 'deployment_complete',
    description: 'Deployed v2.4.2: CI optimization, memory leak fix, health check endpoint. Zero downtime.',
  },
  {
    fromAgent: 'core-architect', toAgent: 'feature-developer',
    content: 'ADR-043 approved: migrating lead scoring to microservice. Will handle 1000+ req/min. Start with the scoring endpoint extraction. ETA: 3 days.',
    messageType: 'task_update', category: 'task', action: 'adr_approved',
    description: 'ADR-043 approved: lead scoring microservice migration. Start extraction. ETA 3 days.',
  },
  {
    fromAgent: 'cyber-guardian', toAgent: 'devops-automator',
    content: 'Security scan: 0 critical, 1 high (node:18 CVE — patching tonight at 2 AM UTC). SAST clean. WAF rules updated for new endpoints. All clear.',
    messageType: 'status_update', category: 'health', action: 'security_scan_complete',
    description: 'Security scan: 0 critical, 1 high (patching tonight). SAST clean. WAF updated.',
  },
  {
    fromAgent: 'qa-tester', toAgent: 'feature-developer',
    content: 'Regression suite: 847 tests passed, 2 flaky (quarantined). Coverage 84%. Performance test: p95 180ms (target 200ms). All green for release.',
    messageType: 'status_update', category: 'health', action: 'regression_complete',
    description: 'Regression: 847 passed, 2 flaky quarantined. Coverage 84%. p95 180ms. Green for release.',
  },
  {
    fromAgent: 'feature-developer', toAgent: 'qa-tester',
    content: 'Fixed the flaky test — race condition in the enrichment queue. Added explicit wait. PR #251 ready for re-review. Should be stable now.',
    messageType: 'text', category: 'task', action: 'bug_fix_complete',
    description: 'Fixed flaky test: race condition in enrichment queue. Added explicit wait. PR #251 ready.',
  },
  {
    fromAgent: 'devops-automator', toAgent: 'cyber-guardian',
    content: 'Container scan found 2 high CVEs in node:18-alpine. Patching to node:18.20-alpine. Deploy at 2 AM UTC. Will rotate secrets after.',
    messageType: 'alert', category: 'deploy', action: 'cve_patching',
    description: 'Container scan: 2 high CVEs. Patching node:18 → 18.20-alpine at 2 AM UTC. Secret rotation after.',
  },
];

// ── Operational conversations ──────────────────────────────────────────
const OPERATIONAL_CONVERSATIONS: ConversationTemplate[] = [
  {
    fromAgent: 'synthetic-hr', toAgent: 'kronos-orchestrator',
    content: 'Hourly health check: all 14 agents healthy. Avg health: 94/100. Sales Engine at 82% utilization (normal for peak hours). No action needed.',
    messageType: 'status_update', category: 'health', action: 'hourly_health_check',
    description: 'Hourly health check: 14 agents healthy. Avg 94/100. Sales Engine 82% utilized.',
  },
  {
    fromAgent: 'kronos-orchestrator', toAgent: 'prometheus-ceo',
    content: 'Event ring status: 4 partitions, depth 142/10000 each. ACK rate 99.2%. Task graph: 3 running, 12 pending. All nominal.',
    messageType: 'status_update', category: 'system', action: 'event_ring_status',
    description: 'Event ring: 4 partitions, 142/10000 depth. ACK 99.2%. Task graph: 3 running, 12 pending.',
  },
  {
    fromAgent: 'compliance-legal', toAgent: 'cfo-ledger',
    content: 'Monthly access review: 3 stale permissions removed. All employees trained. SOC 2 evidence filed. GDPR DSAR queue: 0 pending. All clear.',
    messageType: 'status_update', category: 'health', action: 'compliance_review',
    description: 'Monthly compliance: 3 stale permissions removed. SOC 2 filed. GDPR DSAR queue: 0.',
  },
  {
    fromAgent: 'synthetic-hr', toAgent: 'prometheus-ceo',
    content: 'Weekly capacity report: 2 agents approaching capacity (Sales Engine 82%, Media Buyer 78%). Recommend increasing maxConcurrentTasks. No failures detected.',
    messageType: 'status_update', category: 'system', action: 'capacity_review',
    description: 'Weekly capacity: Sales Engine 82%, Media Buyer 78%. Recommend increasing maxConcurrentTasks.',
  },
  {
    fromAgent: 'cyber-guardian', toAgent: 'compliance-legal',
    content: 'Daily security log review: 0 suspicious access patterns. 3 failed logins (within normal range). All systems operational. No incidents.',
    messageType: 'status_update', category: 'health', action: 'daily_security_review',
    description: 'Daily security: 0 suspicious patterns. 3 failed logins (normal). No incidents.',
  },
];

// ── Strategic conversations ────────────────────────────────────────────
const STRATEGIC_CONVERSATIONS: ConversationTemplate[] = [
  {
    fromAgent: 'prometheus-ceo', toAgent: 'kronos-orchestrator',
    content: 'Monte Carlo cycle complete (N=1000). Q4 revenue forecast confidence: 0.89. Pipeline value trending +15% MoM. No drift detected. Continuing current strategy.',
    messageType: 'status_update', category: 'decision', action: 'monte_carlo_cycle',
    description: 'Monte Carlo N=1000 complete. Q4 forecast confidence 0.89. Pipeline +15% MoM. No drift.',
  },
  {
    fromAgent: 'prometheus-ceo', toAgent: 'cfo-ledger',
    content: 'Strategic directive: increase Growth department budget allocation by 10% next quarter. CAC trending down, LTV trending up. ROI justified. Prepare revised forecast.',
    messageType: 'task_update', category: 'decision', action: 'budget_reallocation',
    description: 'Directive: Growth budget +10% next quarter. CAC down, LTV up. ROI justified.',
  },
  {
    fromAgent: 'market-strategist', toAgent: 'prometheus-ceo',
    content: 'Market analysis: 3 new competitors entered the fintech vertical this month. None have multi-agent capabilities. Our differentiation holds. Recommend doubling down on ABM.',
    messageType: 'text', category: 'decision', action: 'competitive_analysis',
    description: 'Market analysis: 3 new fintech competitors. None have multi-agent. Differentiation holds.',
  },
  {
    fromAgent: 'cfo-ledger', toAgent: 'prometheus-ceo',
    content: 'Unit economics update: LTV/CAC improved to 3.8x (target: 3.0x). Payback period down to 9 months (target: 12). Gross margin 74%. All metrics exceeding targets.',
    messageType: 'status_update', category: 'decision', action: 'unit_economics_update',
    description: 'Unit economics: LTV/CAC 3.8x (target 3.0x). Payback 9mo (target 12). Margin 74%.',
  },
];

const ALL_CONVERSATIONS = [
  ...CLIENT_WORK_CONVERSATIONS,
  ...PLATFORM_CONVERSATIONS,
  ...OPERATIONAL_CONVERSATIONS,
  ...STRATEGIC_CONVERSATIONS,
];

// ── Agent ID cache ─────────────────────────────────────────────────────

const agentIdCache = new Map<string, string>();

async function getAgentId(slug: string): Promise<string | null> {
  if (agentIdCache.has(slug)) return agentIdCache.get(slug)!;
  try {
    const agent = await db.workforceAgent.findFirst({
      where: { slug },
      select: { id: true },
    });
    if (agent) {
      agentIdCache.set(slug, agent.id);
      return agent.id;
    }
  } catch {}
  return null;
}

// ── Generate a single conversation ────────────────────────────────────

async function generateConversation(): Promise<void> {
  // Pick a random conversation template
  const template = ALL_CONVERSATIONS[Math.floor(Math.random() * ALL_CONVERSATIONS.length)];

  const [fromId, toId] = await Promise.all([
    getAgentId(template.fromAgent),
    getAgentId(template.toAgent),
  ]);

  if (!fromId || !toId) return; // Agents not seeded

  const now = new Date();

  // Create chat messages (on both agents)
  await db.workforceChatMessage.create({
    data: {
      agentId: toId,
      role: 'agent_comm',
      content: template.content,
      fromAgent: template.fromAgent,
      toAgent: template.toAgent,
      messageType: template.messageType,
      metadata: JSON.stringify({ source: '247_generator', timestamp: now.toISOString() }),
    },
  });

  await db.workforceChatMessage.create({
    data: {
      agentId: fromId,
      role: 'agent_comm',
      content: template.content,
      fromAgent: template.fromAgent,
      toAgent: template.toAgent,
      messageType: template.messageType,
      metadata: JSON.stringify({ source: '247_generator', direction: 'sent', timestamp: now.toISOString() }),
    },
  });

  // Log the activity on the sending agent
  await logAgentActivity(fromId, {
    category: template.category,
    action: template.action,
    description: template.description,
    level: template.messageType === 'alert' ? 'warn' : 'info',
  });

  // Update lastActiveAt on both agents
  await db.workforceAgent.update({
    where: { id: fromId },
    data: { lastActiveAt: now },
  });
  await db.workforceAgent.update({
    where: { id: toId },
    data: { lastActiveAt: now },
  });

  console.log(`[24/7 Generator] ${template.fromAgent} → ${template.toAgent}: ${template.content.slice(0, 60)}…`);
}

// ── Start the 24/7 generator ──────────────────────────────────────────

export function startWorkforceActivity247(): void {
  if (isRunning) {
    console.log('[24/7 Generator] Already running — skipping start');
    return;
  }

  isRunning = true;
  console.log('[24/7 Generator] Starting 24/7 activity generator (interval: 2-5 min)');

  // Run immediately, then on interval
  generateConversation().catch(() => {});

  const scheduleNext = () => {
    // Random interval between 2-5 minutes (120000-300000 ms)
    const delay = 120000 + Math.random() * 180000;
    intervalHandle = setTimeout(async () => {
      await generateConversation().catch(() => {});
      if (isRunning) scheduleNext();
    }, delay);
  };

  scheduleNext();
}

export function stopWorkforceActivity247(): void {
  isRunning = false;
  if (intervalHandle) {
    clearTimeout(intervalHandle);
    intervalHandle = null;
  }
  console.log('[24/7 Generator] Stopped');
}

export function isWorkforceActivityRunning(): boolean {
  return isRunning;
}
