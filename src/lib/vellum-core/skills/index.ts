/**
 * Skills Engine — Main Entry Point
 *
 * Exports all modules from the LeadReach AI Skills Engine,
 * adapted from the Vellum Assistant skills architecture.
 *
 * Architecture Overview:
 *
 *   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 *   │  SKILL.md    │────▶│   Parser     │────▶│  Definition  │
 *   │  (source)    │     │ (parseSkill) │     │  (validated) │
 *   └──────────────┘     └──────────────┘     └──────┬───────┘
 *                                                     │
 *                          ┌──────────────┐           │
 *                          │   Catalog    │◀──────────┘
 *                          │ (load/merge) │
 *                          └──────┬───────┘
 *                                 │
 *                          ┌──────▼───────┐     ┌──────────────┐
 *                          │   Executor   │────▶│    Tool      │
 *                          │ (execute)    │     │  Execution   │
 *                          └──────────────┘     └──────────────┘
 *
 * Usage:
 *
 *   import { SkillsEngine } from '@/lib/vellum-core/skills';
 *
 *   // Load the skill catalog
 *   const catalog = await SkillsEngine.loadSkillCatalog();
 *
 *   // Search for relevant skills
 *   const skills = await SkillsEngine.searchSkills('find leads');
 *
 *   // Execute a skill
 *   const result = await SkillsEngine.executeSkill(
 *     'prospect-discovery',
 *     { query: 'accounting firms in Dubai' },
 *     { agentName: 'prospect-discovery', scopeId: 'user-123', permissionLevel: 'write' }
 *   );
 */

// ============================================================
// Types (re-exported for convenience)
// ============================================================

export type {
  SkillSource,
  SkillSummary,
  SkillDefinition,
  SkillToolManifest,
  SkillToolEntry,
  SkillToolManifestMeta,
  ToolContext,
  ToolExecutionResult,
  SkillParseResult,
  SkillCatalog,
} from './types';

export {
  SKILL_SOURCE_PRECEDENCE,
  RISK_PERMISSION_MAP,
} from './types';

// ============================================================
// Parser
// ============================================================

export {
  parseSkillFile,
  parseAgentFile,
} from './parser';

// ============================================================
// Catalog
// ============================================================

export {
  loadSkillCatalog,
  loadBundledSkills,
  loadWorkspaceSkills,
  resolveSkillSelector,
  searchSkills,
  getSkillsByCategory,
  getSkillsByAgent,
  listAllSkills,
  invalidateCatalogCache,
} from './catalog';

// ============================================================
// Executor
// ============================================================

export {
  executeSkill,
  executeSkillChain,
  executeSkillsParallel,
  SkillExecutionError,
} from './executor';
