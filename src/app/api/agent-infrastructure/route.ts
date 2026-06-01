/**
 * Agent Infrastructure API
 * =========================
 * GET  /api/agent-infrastructure         — System health + overview
 * POST /api/agent-infrastructure         — Actions (initialize, tick-cron, cleanup)
 * GET  /api/agent-infrastructure?agent=X — Agent-specific infrastructure
 */

import { NextRequest, NextResponse } from 'next/server';
import { AgentRegistry } from '@/lib/agent-infrastructure/registry';
import * as sessions from '@/lib/agent-infrastructure/sessions';
import * as logs from '@/lib/agent-infrastructure/logs';
import * as cron from '@/lib/agent-infrastructure/cron';
import * as skills from '@/lib/agent-infrastructure/skills';
import * as plugins from '@/lib/agent-infrastructure/plugins';
import * as profiles from '@/lib/agent-infrastructure/profiles';
import * as config from '@/lib/agent-infrastructure/config';
import * as keys from '@/lib/agent-infrastructure/keys';
import * as docs from '@/lib/agent-infrastructure/documentation';
import { checkLLMHealth, resetSDK } from '@/lib/llm';
import type { AgentName } from '@/lib/types';

const VALID_AGENTS: AgentName[] = [
  'orchestrator', 'prospect-discovery', 'data-enrichment', 'web-research',
  'lead-qualification', 'outreach-composer', 'pipeline-manager', 'report-generator',
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agent') as AgentName | null;
    const section = searchParams.get('section'); // sessions, logs, cron, skills, plugins, profiles, config, keys, docs

    // System health overview (no agent specified)
    if (!agentName) {
      const health = await AgentRegistry.getSystemHealth();
      // Include LLM health in the system overview
      const llmHealth = await checkLLMHealth();
      return NextResponse.json({ health, llm: llmHealth, agents: VALID_AGENTS });
    }

    // Validate agent name
    if (!VALID_AGENTS.includes(agentName)) {
      return NextResponse.json({ error: `Invalid agent: ${agentName}` }, { status: 400 });
    }

    // Return agent-specific infrastructure data
    switch (section) {
      case 'profile': {
        const profile = await profiles.getProfile(agentName);
        return NextResponse.json({ profile });
      }
      case 'sessions': {
        const activeSession = await sessions.getActiveSession(agentName);
        const sessionList = await sessions.listSessions({ agentName, limit: 20 });
        return NextResponse.json({ activeSession, sessions: sessionList });
      }
      case 'logs': {
        const recentLogs = await logs.queryLogs({ agentName, limit: 50 });
        const performance = await logs.getAgentPerformance(agentName);
        const errors = await logs.getRecentErrors(agentName, 10);
        return NextResponse.json({ logs: recentLogs, performance, errors });
      }
      case 'cron': {
        const cronJobs = await cron.listCronJobs(agentName);
        return NextResponse.json({ cronJobs });
      }
      case 'skills': {
        const skillList = await skills.listSkills(agentName);
        return NextResponse.json({ skills: skillList });
      }
      case 'plugins': {
        const pluginList = await plugins.listPlugins(agentName);
        return NextResponse.json({ plugins: pluginList });
      }
      case 'config': {
        const configMap = await config.getAllConfig(agentName);
        return NextResponse.json({ config: configMap });
      }
      case 'keys': {
        const keyList = await keys.listKeys(agentName);
        return NextResponse.json({ keys: keyList });
      }
      case 'docs': {
        const docList = await docs.getDocs(agentName);
        return NextResponse.json({ docs: docList });
      }
      default: {
        // Return full agent infrastructure overview
        const [profile, activeSession, skillList, pluginList, configMap, keyList, docList, performance] = await Promise.all([
          profiles.getProfile(agentName),
          sessions.getActiveSession(agentName),
          skills.listSkills(agentName),
          plugins.listPlugins(agentName),
          config.getAllConfig(agentName),
          keys.listKeys(agentName),
          docs.getDocs(agentName),
          logs.getAgentPerformance(agentName),
        ]);

        return NextResponse.json({
          agentName,
          profile,
          activeSession,
          skills: skillList,
          plugins: pluginList,
          config: configMap,
          keys: keyList,
          docs: docList,
          performance,
        });
      }
    }
  } catch (error) {
    console.error('[AgentInfrastructure API] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'initialize': {
        await AgentRegistry.initialize();
        const health = await AgentRegistry.getSystemHealth();
        return NextResponse.json({ success: true, health });
      }
      case 'tick-cron': {
        const triggered = await cron.tickCronScheduler();
        return NextResponse.json({ success: true, triggered });
      }
      case 'cleanup-logs': {
        const days = body.days || 90;
        const removed = await logs.cleanupLogs(days);
        return NextResponse.json({ success: true, removed });
      }
      case 'create-session': {
        const { agentName: name, modelId, campaignId } = body;
        if (!name || !VALID_AGENTS.includes(name)) {
          return NextResponse.json({ error: 'Invalid agent name' }, { status: 400 });
        }
        const session = await sessions.createSession({
          agentName: name,
          modelId,
          campaignId,
        });
        return NextResponse.json({ success: true, session });
      }
      case 'create-cron-job': {
        const { agentName: name, ...jobData } = body;
        if (!name || !VALID_AGENTS.includes(name)) {
          return NextResponse.json({ error: 'Invalid agent name' }, { status: 400 });
        }
        const job = await cron.createCronJob({ agentName: name, ...jobData });
        return NextResponse.json({ success: true, job });
      }
      case 'set-config': {
        const { agentName: name, key, value, type, category, description, isSecret } = body;
        if (!name || !VALID_AGENTS.includes(name)) {
          return NextResponse.json({ error: 'Invalid agent name' }, { status: 400 });
        }
        const entry = await config.setConfig({ agentName: name, key, value, type, category, description, isSecret });
        return NextResponse.json({ success: true, config: entry });
      }
      case 'register-key': {
        const { agentName: name, keyName, provider, keyType, keyValue, envVarName, environment } = body;
        if (!name || !VALID_AGENTS.includes(name)) {
          return NextResponse.json({ error: 'Invalid agent name' }, { status: 400 });
        }
        const key = await keys.registerKey({ agentName: name, keyName, provider, keyType, keyValue, envVarName, environment });
        return NextResponse.json({ success: true, key });
      }
      case 'health-check': {
        const llmHealth = await checkLLMHealth();
        const systemHealth = await AgentRegistry.getSystemHealth();
        return NextResponse.json({ success: true, llm: llmHealth, system: systemHealth });
      }
      case 'reset-sdk': {
        resetSDK();
        return NextResponse.json({ success: true, message: 'SDK instance reset — will reinitialize on next call' });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[AgentInfrastructure API] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
