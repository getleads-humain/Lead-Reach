/**
 * Agent Registry — Central Wiring Hub
 * ======================================
 * The registry is the single source of truth for all agent infrastructure.
 * It wires together: sessions, models, logs, cron, skills, plugins,
 * profiles, config, keys, and documentation for each agent.
 *
 * On startup, the registry:
 *   1. Seeds agent profiles (if not already present)
 *   2. Seeds default skills for each agent
 *   3. Seeds default plugins
 *   4. Seeds default config values
 *   5. Seeds default key references
 *   6. Seeds default documentation
 *   7. Starts the cron scheduler tick loop
 *
 * Each agent can then access its infrastructure via:
 *   const agent = await AgentRegistry.get('prospect-discovery');
 *   agent.session  → session manager
 *   agent.model    → model router
 *   agent.logger   → structured logger
 *   agent.cron     → cron scheduler
 *   agent.skills   → skill registry
 *   agent.plugins  → plugin manager
 *   agent.profile  → agent profile
 *   agent.config   → config store
 *   agent.keys     → key manager
 *   agent.docs     → documentation
 */

import { db } from '@/lib/db';
import type { AgentName } from '@/lib/types';
import { AGENT_DEFINITIONS } from '@/lib/types';

// Import all infrastructure modules
import * as sessions from './sessions';
import * as models from './models';
import * as logs from './logs';
import * as cron from './cron';
import * as skills from './skills';
import * as plugins from './plugins';
import * as profiles from './profiles';
import * as config from './config';
import * as keys from './keys';
import * as documentation from './documentation';

// Re-export everything for convenience
export { sessions, models, logs, cron, skills, plugins, profiles, config, keys, documentation };

// ── Agent Context ──────────────────────────────────────────────

export interface AgentContext {
  agentName: AgentName;
  sessions: typeof sessions;
  models: typeof models;
  logs: typeof logs;
  cron: typeof cron;
  skills: typeof skills;
  plugins: typeof plugins;
  profiles: typeof profiles;
  config: typeof config;
  keys: typeof keys;
  docs: typeof documentation;
}

// ── Registry ───────────────────────────────────────────────────

class AgentRegistryClass {
  private initialized = false;

  /**
   * Get an agent's full infrastructure context.
   * This is the primary entry point for agents to access their resources.
   */
  get(agentName: AgentName): AgentContext {
    return {
      agentName,
      sessions,
      models,
      logs,
      cron,
      skills,
      plugins,
      profiles,
      config,
      keys,
      docs: documentation,
    };
  }

  /**
   * Initialize the agent infrastructure.
   * Seeds all default data if not already present.
   * Should be called once at application startup.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[AgentRegistry] Initializing agent infrastructure...');

    try {
      // 1. Seed agent profiles
      const profileCount = await profiles.seedAllProfiles();
      console.log(`[AgentRegistry] Seeded ${profileCount} agent profiles`);

      // 2. Seed default skills
      const skillCount = await this.seedDefaultSkills();
      console.log(`[AgentRegistry] Seeded ${skillCount} agent skills`);

      // 3. Seed default plugins
      const pluginCount = await this.seedDefaultPlugins();
      console.log(`[AgentRegistry] Seeded ${pluginCount} agent plugins`);

      // 4. Seed default config
      const configCount = await this.seedDefaultConfig();
      console.log(`[AgentRegistry] Seeded ${configCount} config entries`);

      // 5. Seed default key references
      const keyCount = await keys.seedDefaultKeys();
      console.log(`[AgentRegistry] Seeded ${keyCount} key references`);

      // 6. Seed default documentation
      const docCount = await documentation.seedDefaultDocs();
      console.log(`[AgentRegistry] Seeded ${docCount} documentation entries`);

      this.initialized = true;
      console.log('[AgentRegistry] Agent infrastructure initialized successfully');
    } catch (error) {
      console.error('[AgentRegistry] Initialization failed:', error);
      // Non-fatal — the application can still function with partial infrastructure
    }
  }

  /**
   * Seed default skills for all 8 agents.
   */
  private async seedDefaultSkills(): Promise<number> {
    const defaultSkills: skills.SkillDefinition[] = [
      // Orchestrator
      { agentName: 'orchestrator', name: 'plan_workflow', displayName: 'Plan Workflow', description: 'Decompose a request into an ordered execution plan of sub-tasks', category: 'coordinate', handler: 'executeOrchestrator', channels: [], priority: 10 },
      // Prospect Discovery
      { agentName: 'prospect-discovery', name: 'discover_companies', displayName: 'Discover Companies', description: 'Search 17+ channels for companies matching ICP criteria', category: 'search', handler: 'executeProspectDiscovery', channels: ['web', 'linkedin', 'exa', 'github', 'reddit', 'twitter', 'youtube'], priority: 10 },
      { agentName: 'prospect-discovery', name: 'deep_search', displayName: 'Deep Search', description: 'Multi-round deep search with sub-query generation', category: 'search', handler: 'executeProspectDiscovery', channels: ['web', 'linkedin', 'exa', 'github', 'reddit', 'twitter', 'youtube'], priority: 8 },
      // Data Enrichment
      { agentName: 'data-enrichment', name: 'enrich_leads', displayName: 'Enrich Leads', description: 'Enrich lead records with firmographics and technographics', category: 'enrich', handler: 'executeDataEnrichment', channels: ['web', 'linkedin', 'exa', 'twitter', 'github'], priority: 10 },
      { agentName: 'data-enrichment', name: 'extract_contacts', displayName: 'Extract Contacts', description: 'Extract key contact information from company data', category: 'enrich', handler: 'executeDataEnrichment', channels: ['web', 'linkedin'], priority: 8 },
      // Web Research
      { agentName: 'web-research', name: 'research_company', displayName: 'Research Company', description: 'Deep research on a specific company across all channels', category: 'search', handler: 'executeWebResearch', channels: ['web', 'exa', 'linkedin', 'twitter', 'youtube', 'reddit', 'rss'], priority: 10 },
      { agentName: 'web-research', name: 'market_analysis', displayName: 'Market Analysis', description: 'Analyze market trends and competitive landscape', category: 'search', handler: 'executeWebResearch', channels: ['web', 'exa', 'linkedin', 'twitter', 'rss'], priority: 8 },
      // Lead Qualification
      { agentName: 'lead-qualification', name: 'score_bant', displayName: 'BANT Scoring', description: 'Score leads using Budget, Authority, Need, Timeline framework', category: 'qualify', handler: 'executeLeadQualification', channels: ['web', 'linkedin', 'exa'], priority: 10 },
      { agentName: 'lead-qualification', name: 'score_meddic', displayName: 'MEDDIC Scoring', description: 'Score leads using MEDDIC evaluation framework', category: 'qualify', handler: 'executeLeadQualification', channels: ['web', 'linkedin', 'exa'], priority: 8 },
      { agentName: 'lead-qualification', name: 'score_icp', displayName: 'ICP Matching', description: 'Score leads against Ideal Customer Profile criteria', category: 'qualify', handler: 'executeLeadQualification', channels: ['web', 'linkedin', 'exa'], priority: 9 },
      // Outreach Composer
      { agentName: 'outreach-composer', name: 'compose_email', displayName: 'Compose Email', description: 'Generate personalized cold email using copywriting frameworks', category: 'outreach', handler: 'executeOutreachComposer', channels: ['linkedin', 'web', 'exa'], priority: 10 },
      { agentName: 'outreach-composer', name: 'compose_linkedin', displayName: 'Compose LinkedIn Message', description: 'Generate personalized LinkedIn connection request or message', category: 'outreach', handler: 'executeOutreachComposer', channels: ['linkedin', 'web', 'exa'], priority: 9 },
      { agentName: 'outreach-composer', name: 'design_sequence', displayName: 'Design Sequence', description: 'Create multi-step outreach sequence with follow-ups', category: 'outreach', handler: 'executeOutreachComposer', channels: ['linkedin', 'web', 'exa'], priority: 8 },
      // Pipeline Manager
      { agentName: 'pipeline-manager', name: 'manage_stages', displayName: 'Manage Stages', description: 'Transition leads through pipeline stages', category: 'manage', handler: 'executePipelineManager', channels: [], priority: 10 },
      { agentName: 'pipeline-manager', name: 'schedule_followups', displayName: 'Schedule Follow-ups', description: 'Create and manage follow-up schedules', category: 'manage', handler: 'executePipelineManager', channels: [], priority: 9 },
      // Report Generator
      { agentName: 'report-generator', name: 'pipeline_report', displayName: 'Pipeline Report', description: 'Generate pipeline health and performance report', category: 'report', handler: 'executeReportGenerator', channels: [], priority: 10 },
      { agentName: 'report-generator', name: 'ai_insights', displayName: 'AI Insights', description: 'Generate AI-powered insights and recommendations', category: 'report', handler: 'executeReportGenerator', channels: [], priority: 9 },
      { agentName: 'report-generator', name: 'action_items', displayName: 'Action Items', description: 'Generate prioritized action items based on data analysis', category: 'report', handler: 'executeReportGenerator', channels: [], priority: 8 },
    ];

    let created = 0;
    for (const skill of defaultSkills) {
      try {
        await skills.registerSkill(skill);
        created++;
      } catch {
        // May already exist
      }
    }
    return created;
  }

  /**
   * Seed default plugins for all agents.
   */
  private async seedDefaultPlugins(): Promise<number> {
    const defaultPlugins: plugins.PluginDefinition[] = [
      // GHL integration — available to pipeline-manager and outreach-composer
      {
        agentName: 'pipeline-manager',
        name: 'ghl_sync',
        displayName: 'GoHighLevel CRM Sync',
        description: 'Sync pipeline stages and lead data with GoHighLevel CRM',
        type: 'integration',
        provider: 'ghl',
        hooks: ['task.completed', 'pipeline.stage_changed'],
      },
      {
        agentName: 'outreach-composer',
        name: 'ghl_outreach',
        displayName: 'GHL Outreach Tracker',
        description: 'Track outreach messages in GoHighLevel',
        type: 'integration',
        provider: 'ghl',
        hooks: ['task.completed'],
      },
      // Notification plugins
      {
        agentName: 'lead-qualification',
        name: 'hot_lead_alert',
        displayName: 'Hot Lead Alert',
        description: 'Send notifications when leads score above hot threshold',
        type: 'notification',
        hooks: ['task.completed'],
      },
      // Analytics plugins
      {
        agentName: 'report-generator',
        name: 'performance_tracker',
        displayName: 'Performance Tracker',
        description: 'Track and store performance metrics for dashboard analytics',
        type: 'analytics',
        hooks: ['task.completed'],
      },
    ];

    let created = 0;
    for (const plugin of defaultPlugins) {
      try {
        await plugins.registerPlugin(plugin);
        created++;
      } catch {
        // May already exist
      }
    }
    return created;
  }

  /**
   * Seed default config for all agents.
   */
  private async seedDefaultConfig(): Promise<number> {
    const defaultConfigs: config.ConfigEntry[] = [
      // Model defaults (all agents)
      ...AGENT_DEFINITIONS.map(def => [
        { agentName: def.name as AgentName, key: 'preferred_model', value: 'glm-4.7-flash', type: 'string' as const, category: 'model' as const, description: 'Preferred GLM model for this agent' },
        { agentName: def.name as AgentName, key: 'fallback_model', value: 'glm-4.6v-flash', type: 'string' as const, category: 'model' as const, description: 'Fallback GLM model when primary fails' },
        { agentName: def.name as AgentName, key: 'temperature', value: 0.3, type: 'number' as const, category: 'model' as const, description: 'LLM temperature for this agent' },
        { agentName: def.name as AgentName, key: 'max_tokens', value: 4096, type: 'number' as const, category: 'model' as const, description: 'Max tokens per LLM response' },
        { agentName: def.name as AgentName, key: 'retries_per_model', value: 3, type: 'number' as const, category: 'model' as const, description: 'Number of retries per model before fallback' },
      ]).flat(),
      // Rate limiting (all agents)
      ...AGENT_DEFINITIONS.map(def => ({
        agentName: def.name as AgentName,
        key: 'rate_limit_per_min',
        value: 10,
        type: 'number' as const,
        category: 'rate_limit' as const,
        description: 'Maximum LLM calls per minute for this agent',
      })),
      // Agent-specific configs
      { agentName: 'prospect-discovery', key: 'max_search_results', value: 200, type: 'number', category: 'general', description: 'Maximum search results to process per discovery' },
      { agentName: 'prospect-discovery', key: 'deep_search_enabled', value: true, type: 'boolean', category: 'general', description: 'Enable multi-round deep search' },
      { agentName: 'prospect-discovery', key: 'deep_search_max_subqueries', value: 5, type: 'number', category: 'general', description: 'Maximum sub-queries for deep search' },
      { agentName: 'data-enrichment', key: 'batch_size', value: 500, type: 'number', category: 'general', description: 'Number of leads to enrich per batch' },
      { agentName: 'lead-qualification', key: 'hot_threshold', value: 70, type: 'number', category: 'general', description: 'Score threshold for hot lead classification' },
      { agentName: 'lead-qualification', key: 'warm_threshold', value: 40, type: 'number', category: 'general', description: 'Score threshold for warm lead classification' },
      { agentName: 'outreach-composer', key: 'default_framework', value: 'AIDA', type: 'string', category: 'skill', description: 'Default copywriting framework' },
      { agentName: 'outreach-composer', key: 'max_sequence_steps', value: 7, type: 'number', category: 'skill', description: 'Maximum steps in an outreach sequence' },
    ];

    let created = 0;
    for (const entry of defaultConfigs) {
      try {
        await config.setConfig(entry);
        created++;
      } catch {
        // May already exist
      }
    }
    return created;
  }

  /**
   * Get system health — status of all agent infrastructure.
   */
  async getSystemHealth() {
    const [
      profileCount,
      sessionCount,
      activeSessionCount,
      logCount,
      cronJobCount,
      activeCronCount,
      skillCount,
      pluginCount,
      configCount,
      keyCount,
      docCount,
    ] = await Promise.all([
      db.agentProfile.count(),
      db.agentSession.count(),
      db.agentSession.count({ where: { status: 'active' } }),
      db.agentLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      db.agentCronJob.count(),
      db.agentCronJob.count({ where: { status: 'active' } }),
      db.agentSkill.count({ where: { status: 'active' } }),
      db.agentPlugin.count({ where: { enabled: true } }),
      db.agentConfig.count(),
      db.agentKey.count({ where: { status: 'active' } }),
      db.agentDocumentation.count({ where: { status: 'published' } }),
    ]);

    return {
      profiles: { total: profileCount, expected: 8, healthy: profileCount >= 8 },
      sessions: { total: sessionCount, active: activeSessionCount },
      logs: { last24h: logCount },
      cron: { total: cronJobCount, active: activeCronCount },
      skills: { total: skillCount },
      plugins: { total: pluginCount },
      config: { total: configCount },
      keys: { total: keyCount },
      docs: { total: docCount },
    };
  }
}

/**
 * Singleton registry instance.
 * Import and use: `import { AgentRegistry } from '@/lib/agent-infrastructure';`
 */
export const AgentRegistry = new AgentRegistryClass();
