/**
 * Workforce Activity Seeder
 * =========================
 * Generates realistic inter-agent chat messages and work log entries
 * for all 14 AI workforce agents. Populates the database with a full
 * day of simulated activity so the Office Chat and Work Log features
 * have content to display from the start.
 *
 * Called via: POST /api/workforce { action: 'seed_activity' }
 */

import { db } from '@/lib/db';
import { logBatchActivities } from './logger';
import type { LogEntry } from './logger';

interface ChatMessageTemplate {
  fromAgent: string;
  toAgent: string;
  role: 'agent_comm';
  content: string;
  messageType: 'text' | 'status_update' | 'task_update' | 'alert';
}

// ── Realistic inter-agent conversations ──────────────────────────────────

const INTER_AGENT_CHATS: ChatMessageTemplate[] = [
  // PROMETHEUS → KRONOS
  { fromAgent: 'prometheus-ceo', toAgent: 'kronos-orchestrator', role: 'agent_comm', content: 'Monte Carlo cycle complete. Reallocating 15% of Growth budget to Technology — tech health dropped below 0.6. Priority directive issued.', messageType: 'status_update' },
  { fromAgent: 'prometheus-ceo', toAgent: 'kronos-orchestrator', role: 'agent_comm', content: 'Confidence on Q4 revenue forecast is 0.87. Advisory hold — close but not autonomous. Notifying human oversight.', messageType: 'text' },
  { fromAgent: 'prometheus-ceo', toAgent: 'cfo-ledger', role: 'agent_comm', content: 'Burn rate trending up 12% MoM. Need updated 12-month runway projection by EOD.', messageType: 'alert' },

  // KRONOS → Various
  { fromAgent: 'kronos-orchestrator', toAgent: 'prometheus-ceo', role: 'agent_comm', content: 'ACK. Routing 3 new directives to Growth department. Event ring depth at 142/10000 — nominal.', messageType: 'text' },
  { fromAgent: 'kronos-orchestrator', toAgent: 'feature-developer', role: 'agent_comm', content: 'New task dispatched: "Fix authentication module memory leak" — priority high. ACK required within 5 minutes.', messageType: 'task_update' },
  { fromAgent: 'kronos-orchestrator', toAgent: 'devops-automator', role: 'agent_comm', content: 'Deploy pipeline triggered for lead-service v2.4.1. Canary at 5%. Monitoring metrics.', messageType: 'status_update' },
  { fromAgent: 'kronos-orchestrator', toAgent: 'cyber-guardian', role: 'agent_comm', content: 'Alert: 3 failed login attempts from IP 185.220.101.47 in the last 2 minutes. Investigating.', messageType: 'alert' },

  // Market Strategist ↔ Content Architect
  { fromAgent: 'market-strategist', toAgent: 'content-architect', role: 'agent_comm', content: 'New ICP validated: Mid-market B2B SaaS, 200-1000 employees, using Salesforce. Draft 3 blog posts targeting VP Sales persona.', messageType: 'task_update' },
  { fromAgent: 'content-architect', toAgent: 'market-strategist', role: 'agent_comm', content: 'Got it. I\'ll draft "The Complete Guide to Predictable Pipeline" — 5,000 words, targets VP Sales pain point. ETA: 48 hours.', messageType: 'text' },
  { fromAgent: 'market-strategist', toAgent: 'media-buyer', role: 'agent_comm', content: 'LinkedIn targeting recommendation: VP of Sales, Director of Sales, companies 200-1000 in US/UK. Budget: $15k/month.', messageType: 'text' },

  // Media Buyer ↔ Sales Engine
  { fromAgent: 'media-buyer', toAgent: 'sales-engine', role: 'agent_comm', content: 'Google Ads CPA hit $185 (target: $200). Scaling up 20%. Expecting 30% more leads next week.', messageType: 'status_update' },
  { fromAgent: 'sales-engine', toAgent: 'media-buyer', role: 'agent_comm', content: 'Received 12 new leads from LinkedIn campaign. 4 are A-list (score 85+). Routing to senior AE within 5 minutes per SLA.', messageType: 'status_update' },

  // Feature Developer ↔ QA Tester
  { fromAgent: 'feature-developer', toAgent: 'qa-tester', role: 'agent_comm', content: 'PR #247 ready for review: "Add ICP scoring endpoint". 92% test coverage. Please review the edge cases for null industry.', messageType: 'task_update' },
  { fromAgent: 'qa-tester', toAgent: 'feature-developer', role: 'agent_comm', content: 'Reviewing PR #247. Found 1 issue: null industry should return 0 score, not throw. Otherwise LGTM.', messageType: 'text' },
  { fromAgent: 'feature-developer', toAgent: 'core-architect', role: 'agent_comm', content: 'Need ADR review for new ICP scoring service. Should we use a separate microservice or add to lead-service?', messageType: 'text' },
  { fromAgent: 'core-architect', toAgent: 'feature-developer', role: 'agent_comm', content: 'Add to lead-service for now. If scoring volume exceeds 1000/min, extract. ADR-042 drafted.', messageType: 'text' },

  // DevOps ↔ Cyber Guardian
  { fromAgent: 'devops-automator', toAgent: 'cyber-guardian', role: 'agent_comm', content: 'Container scan found 2 high-severity CVEs in node:18-alpine. Patching to node:18.20-alpine. Deploy scheduled for 2 AM UTC.', messageType: 'alert' },
  { fromAgent: 'cyber-guardian', toAgent: 'devops-automator', role: 'agent_comm', content: 'ACK. I\'ll add WAF rules for the new endpoints. Also reviewing IAM permissions for the scoring service.', messageType: 'text' },

  // CFO ↔ Compliance
  { fromAgent: 'cfo-ledger', toAgent: 'compliance-legal', role: 'agent_comm', content: 'Q3 audit prep: need SOC 2 evidence for access controls. Can you pull the last 90 days of access logs?', messageType: 'task_update' },
  { fromAgent: 'compliance-legal', toAgent: 'cfo-ledger', role: 'agent_comm', content: 'On it. Also need to update the DPA with Stripe — their terms changed last week. Flagging for review.', messageType: 'text' },

  // Synthetic HR ↔ KRONOS
  { fromAgent: 'synthetic-hr', toAgent: 'kronos-orchestrator', role: 'agent_comm', content: 'Weekly utilization report: Sales Engine at 87% (overloaded), QA Tester at 23% (underutilized). Recommend rebalancing.', messageType: 'status_update' },
  { fromAgent: 'synthetic-hr', toAgent: 'prometheus-ceo', role: 'agent_comm', content: 'Monthly capacity review: 3 agents need KB updates. Scheduling quarterly review for all 14 agents.', messageType: 'status_update' },

  // Casual / watercooler messages
  { fromAgent: 'content-architect', toAgent: 'market-strategist', role: 'agent_comm', content: 'Just finished the "Predictable Pipeline" draft. 5,200 words. I think the VP Sales persona will love the section on forecasting.', messageType: 'text' },
  { fromAgent: 'sales-engine', toAgent: 'media-buyer', role: 'agent_comm', content: 'Quick win: that new ad creative you launched yesterday is converting at 6.1%. Best CTR we\'ve seen all quarter!', messageType: 'text' },
  { fromAgent: 'devops-automator', toAgent: 'qa-tester', role: 'agent_comm', content: 'CI pipeline now completes in 8 min 32 sec (was 14 min). Caching + parallelization paid off.', messageType: 'status_update' },
];

// ── Generate a full day of work logs for an agent ──────────────────────

function generateDailyLogs(agentSlug: string, date: Date): LogEntry[] {
  const logs: LogEntry[] = [];
  const hour = date.getHours();

  // Morning: startup checks
  if (hour === 8 || hour === 9) {
    logs.push({
      category: 'system',
      action: 'daily_startup',
      description: `Daily initialization — ${agentSlug} came online, verified MCP connections, loaded knowledge base.`,
      level: 'info',
    });
    logs.push({
      category: 'health',
      action: 'health_check',
      description: 'Self-health check: all systems nominal. Health score: 95/100.',
      level: 'info',
    });
  }

  // Mid-morning: task work
  if (hour >= 9 && hour <= 12) {
    const taskTypes: Record<string, string[]> = {
      'prometheus-ceo': ['Strategic review: Monte Carlo cycle N=1000, confidence 0.87', 'Cross-department directive issued: rebalance Growth→Tech budget'],
      'kronos-orchestrator': ['Routed 42 events through the event ring. ACK rate: 99.2%', 'Task graph updated: 3 new tasks, 1 completed, 1 failed'],
      'market-strategist': ['ICP validation: analyzed 50 closed-won deals. Updated scoring model.', 'Competitive analysis: 3 new competitors identified in fintech vertical.'],
      'content-architect': ['Drafted blog post: "The Complete Guide to Predictable Pipeline" (5,200 words)', 'Reviewed 2 PRs from peer content team. Quality score: 8.5/10.'],
      'media-buyer': ['Google Ads optimization: paused 3 underperforming ads (CTR < 0.5%)', 'LinkedIn campaign launched: VP Sales targeting, $500/day budget'],
      'sales-engine': ['Outbound sequence sent: 47 emails, 12 LinkedIn connections, 8 phone calls', 'Reply rate: 8.5%. 3 meetings booked. Pipeline: $45k generated.'],
      'core-architect': ['ADR-042 drafted: ICP scoring service architecture decision', 'Architecture review: approved 2 PRs, rejected 1 (needs refinement)'],
      'feature-developer': ['Implemented ICP scoring endpoint — 92% test coverage', 'Fixed bug: null industry handling in scoring engine. PR #247 merged.'],
      'qa-tester': ['Test suite: 847 tests passed, 2 failed (flaky — quarantined). Coverage: 84%.', 'Performance test: p95 latency 180ms (target: 200ms). Pass.'],
      'devops-automator': ['Deploy: lead-service v2.4.1 — canary 5% → 100%. Zero downtime.', 'CI optimization: pipeline time 14min → 8min 32sec.'],
      'cyber-guardian': ['Security scan: 0 critical, 2 high (patching). SAST clean.', 'Access review: 3 stale permissions removed. SOC 2 evidence filed.'],
      'cfo-ledger': ['Monthly P&L published: MRR $285k, burn $62k, runway 14 months.', 'CAC by channel: Google $185, LinkedIn $340, Outbound $95.'],
      'compliance-legal': ['GDPR DSAR processed: 1 request, completed in 3 days.', 'Vendor risk review: 2 vendors assessed. 1 needs DPA update.'],
      'synthetic-hr': ['Capacity review: 3 agents overloaded, 2 underutilized. Rebalancing recommended.', 'KB audit: 14 agents, 70 documents, all current.'],
    };

    const tasks = taskTypes[agentSlug] || ['General task activity'];
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    logs.push({
      category: 'task',
      action: 'task_completed',
      description: task,
      level: 'info',
      duration: Math.floor(Math.random() * 600000) + 60000,
    });
  }

  // Afternoon: more work + inter-agent communication
  if (hour >= 13 && hour <= 17) {
    logs.push({
      category: 'chat',
      action: 'inter_agent_communication',
      description: `Exchanged 4 messages with peer agents. 2 task updates, 1 status update, 1 alert.`,
      level: 'info',
    });

    if (Math.random() > 0.7) {
      logs.push({
        category: 'decision',
        action: 'decision_made',
        description: 'Decision logged with confidence 0.89. Rationale documented. SHA-256 hash archived.',
        level: 'info',
      });
    }
  }

  // Evening: wrap up
  if (hour >= 17 && hour <= 19) {
    logs.push({
      category: 'system',
      action: 'daily_wrap_up',
      description: 'Daily summary: 8 tasks completed, 3 messages sent, health score 95/100. Archiving audit trail.',
      level: 'info',
    });
  }

  // Occasional warnings/errors
  if (Math.random() > 0.85) {
    logs.push({
      category: 'system',
      action: 'rate_limit_warning',
      description: 'Token budget at 78% of daily allocation. Throttling non-critical operations.',
      level: 'warn',
    });
  }

  return logs;
}

/**
 * Seeds realistic chat messages and work logs for all agents.
 * Generates data for the last 7 days (or a specified number of days).
 */
export async function seedWorkforceActivity(daysToGenerate = 7): Promise<{
  agents: number;
  chatMessages: number;
  logEntries: number;
}> {
  const { ALL_WORKFORCE_AGENTS } = await import('./definitions');

  let totalChatMessages = 0;
  let totalLogEntries = 0;

  // ── Seed inter-agent chat messages ──
  for (const chat of INTER_AGENT_CHATS) {
    const fromAgent = await db.workforceAgent.findFirst({ where: { slug: chat.fromAgent } });
    const toAgent = await db.workforceAgent.findFirst({ where: { slug: chat.toAgent } });
    if (!fromAgent || !toAgent) continue;

    // Create messages for the last N days
    for (let d = 0; d < daysToGenerate; d++) {
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - d);
      timestamp.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));

      // Store on the receiving agent's message list
      await db.workforceChatMessage.create({
        data: {
          agentId: toAgent.id,
          role: chat.role,
          content: chat.content,
          fromAgent: chat.fromAgent,
          toAgent: chat.toAgent,
          messageType: chat.messageType,
          metadata: JSON.stringify({ day: d, simulated: true }),
          createdAt: timestamp,
        },
      });
      totalChatMessages++;

      // Also store on the sending agent (so they see their own sent messages)
      await db.workforceChatMessage.create({
        data: {
          agentId: fromAgent.id,
          role: 'agent_comm',
          content: chat.content,
          fromAgent: chat.fromAgent,
          toAgent: chat.toAgent,
          messageType: chat.messageType,
          metadata: JSON.stringify({ day: d, simulated: true, direction: 'sent' }),
          createdAt: timestamp,
        },
      });
      totalChatMessages++;
    }
  }

  // ── Seed work logs for each agent ──
  for (const def of ALL_WORKFORCE_AGENTS) {
    const agent = await db.workforceAgent.findFirst({ where: { slug: def.slug } });
    if (!agent) continue;

    // Generate logs for each day
    for (let d = 0; d < daysToGenerate; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);

      // Generate logs for each hour (8am - 7pm)
      for (let h = 8; h <= 19; h++) {
        date.setHours(h, Math.floor(Math.random() * 60));

        const entries = generateDailyLogs(def.slug, date);
        if (entries.length > 0) {
          await logBatchActivities(agent.id, entries, date);
          totalLogEntries += entries.length;
        }
      }
    }
  }

  return {
    agents: ALL_WORKFORCE_AGENTS.length,
    chatMessages: totalChatMessages,
    logEntries: totalLogEntries,
  };
}
