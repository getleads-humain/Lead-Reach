/**
 * Skills Catalog — Skill Discovery and Management
 *
 * Manages the catalog of available skills, loading them from multiple sources
 * with a defined precedence hierarchy:
 *
 *   extra < bundled < plugin < managed < workspace
 *
 * Sources:
 *   1. **Bundled**: Reads from the /agents/ directory (existing LeadReach agents)
 *   2. **Workspace**: Reads from a configurable workspace directory
 *   3. **Extra/Plugin/Managed**: Loaded programmatically at runtime
 *
 * The catalog supports:
 *   - Loading and merging skills from multiple sources
 *   - Searching skills by name, description, or activation hints
 *   - Resolving a skill selector (ID) to a full definition
 *   - Category-based organization
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import type {
  SkillSummary,
  SkillDefinition,
  SkillSource,
  SkillCatalog,
  SkillToolManifest,
  SkillToolManifestMeta,
} from './types';
import { SKILL_SOURCE_PRECEDENCE } from './types';
import { parseSkillFile, parseAgentFile } from './parser';

// ============================================================
// Constants
// ============================================================

/** Path to the bundled agents directory (relative to project root) */
const AGENTS_DIR = join(process.cwd(), 'agents');

/** Default workspace skills directory */
const DEFAULT_WORKSPACE_DIR = join(process.cwd(), 'workspace', 'skills');

// ============================================================
// Catalog State (Singleton)
// ============================================================

let catalogCache: SkillCatalog | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Create an empty skill catalog.
 */
function createEmptyCatalog(): SkillCatalog {
  return {
    skills: new Map(),
    bySource: {
      extra: [],
      bundled: [],
      plugin: [],
      managed: [],
      workspace: [],
    },
    byCategory: new Map(),
    byAgent: new Map(),
    lastRefreshedAt: 0,
  };
}

// ============================================================
// TOOLS.json Loading
// ============================================================

/**
 * Try to load and parse a TOOLS.json file from a skill directory.
 *
 * @param directoryPath - The skill directory to look in
 * @returns Manifest metadata
 */
async function loadToolManifest(
  directoryPath: string,
): Promise<SkillToolManifestMeta> {
  const defaultMeta: SkillToolManifestMeta = {
    present: false,
    valid: false,
    toolCount: 0,
    toolNames: [],
  };

  try {
    const manifestPath = join(directoryPath, 'TOOLS.json');
    const content = await readFile(manifestPath, 'utf-8');
    const parsed = JSON.parse(content) as SkillToolManifest;

    // Basic validation
    if (!parsed.tools || !Array.isArray(parsed.tools)) {
      return {
        ...defaultMeta,
        present: true,
        valid: false,
      };
    }

    const toolNames = parsed.tools.map((t) => t.name);

    // Compute a simple hash for change detection
    const hash = simpleHash(content);

    return {
      present: true,
      valid: true,
      toolCount: parsed.tools.length,
      toolNames,
      versionHash: hash,
    };
  } catch {
    // TOOLS.json doesn't exist or is invalid — that's OK
    return defaultMeta;
  }
}

/**
 * Simple string hash for change detection.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================
// Bundled Skills Loading
// ============================================================

/**
 * Load bundled skills from the /agents/ directory.
 * Each subdirectory is expected to contain:
 *   - agent.md (required): Agent definition
 *   - skill.md (optional): Skill reference documentation
 *   - TOOLS.json (optional): Tool manifest
 *
 * The skill.md takes precedence over agent.md if both exist,
 * as it contains the structured skill definition.
 */
export async function loadBundledSkills(): Promise<SkillDefinition[]> {
  const skills: SkillDefinition[] = [];

  try {
    const entries = await readdir(AGENTS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const agentDir = join(AGENTS_DIR, entry.name);
      const skillMdPath = join(agentDir, 'skill.md');
      const agentMdPath = join(agentDir, 'agent.md');

      let skillDef: SkillDefinition | null = null;

      // Try skill.md first (structured skill definition)
      try {
        const content = await readFile(skillMdPath, 'utf-8');
        const result = parseSkillFile(content, skillMdPath, 'bundled');

        if (result.success && result.skill) {
          skillDef = result.skill;
        }
      } catch {
        // skill.md doesn't exist — try agent.md
      }

      // Fall back to agent.md
      if (!skillDef) {
        try {
          const content = await readFile(agentMdPath, 'utf-8');
          const result = parseAgentFile(content, agentMdPath);

          if (result.success && result.skill) {
            skillDef = result.skill;
          }
        } catch {
          // agent.md also doesn't exist — skip this directory
          continue;
        }
      }

      if (skillDef) {
        // Load tool manifest if available
        const manifestMeta = await loadToolManifest(agentDir);
        skillDef.toolManifest = manifestMeta;

        // Ensure the ID matches the directory name
        if (!skillDef.id || skillDef.id === '') {
          skillDef.id = entry.name;
        }
        if (!skillDef.name || skillDef.name === '') {
          skillDef.name = entry.name;
        }

        skills.push(skillDef);
      }
    }
  } catch (error) {
    console.warn(
      `[SkillCatalog] Failed to load bundled skills: ${error instanceof Error ? error.message : 'Unknown'}`,
    );
  }

  return skills;
}

// ============================================================
// Workspace Skills Loading
// ============================================================

/**
 * Load workspace skills from a configurable directory.
 * Workspace skills override bundled skills with the same name.
 */
export async function loadWorkspaceSkills(
  dir: string = DEFAULT_WORKSPACE_DIR,
): Promise<SkillDefinition[]> {
  const skills: SkillDefinition[] = [];

  try {
    const dirStat = await stat(dir);
    if (!dirStat.isDirectory()) return skills;

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillDir = join(dir, entry.name);
      const skillMdPath = join(skillDir, 'skill.md');

      try {
        const content = await readFile(skillMdPath, 'utf-8');
        const result = parseSkillFile(content, skillMdPath, 'workspace');

        if (result.success && result.skill) {
          const skillDef = result.skill;

          // Load tool manifest
          const manifestMeta = await loadToolManifest(skillDir);
          skillDef.toolManifest = manifestMeta;

          // Ensure ID matches directory name
          if (!skillDef.id || skillDef.id === '') {
            skillDef.id = entry.name;
          }

          skills.push(skillDef);
        }
      } catch {
        // skill.md doesn't exist — skip
      }
    }
  } catch {
    // Workspace directory doesn't exist — that's fine
  }

  return skills;
}

// ============================================================
// Catalog Building
// ============================================================

/**
 * Build the skill catalog by loading and merging skills from all sources.
 *
 * Precedence: extra < bundled < plugin < managed < workspace
 * When two skills share the same name, the one from the higher-precedence
 * source wins.
 *
 * @param workspaceDir - Optional workspace directory override
 * @returns The complete skill catalog
 */
export async function loadSkillCatalog(
  workspaceDir?: string,
): Promise<SkillCatalog> {
  // Return cached catalog if still valid
  if (catalogCache && Date.now() < cacheExpiry) {
    return catalogCache;
  }

  const catalog = createEmptyCatalog();

  // Load from each source (in precedence order, lowest first)
  const sourceLoads: Array<{ source: SkillSource; loader: () => Promise<SkillDefinition[]> }> = [
    { source: 'extra', loader: async () => [] }, // Extra skills loaded at runtime
    { source: 'bundled', loader: loadBundledSkills },
    { source: 'plugin', loader: async () => [] }, // Plugin skills loaded at runtime
    { source: 'managed', loader: async () => [] }, // Managed skills loaded at runtime
    { source: 'workspace', loader: () => loadWorkspaceSkills(workspaceDir) },
  ];

  // Track skills by name for precedence resolution
  const skillsByName = new Map<string, { skill: SkillDefinition; precedence: number }>();

  for (const { source, loader } of sourceLoads) {
    try {
      const skills = await loader();
      const precedence = SKILL_SOURCE_PRECEDENCE[source];

      for (const skill of skills) {
        const existing = skillsByName.get(skill.name);

        // Only override if this source has higher precedence
        if (!existing || precedence > existing.precedence) {
          skillsByName.set(skill.name, { skill, precedence });
        }

        // Add to source-indexed list
        catalog.bySource[source].push(skill);
      }
    } catch (error) {
      console.warn(
        `[SkillCatalog] Failed to load skills from source "${source}": ${error instanceof Error ? error.message : 'Unknown'}`,
      );
    }
  }

  // Build the final catalog from precedence-resolved skills
  for (const { skill } of skillsByName.values()) {
    catalog.skills.set(skill.id, skill);

    // Index by category (derived from directory name or explicit category)
    const category = deriveCategory(skill);
    if (!catalog.byCategory.has(category)) {
      catalog.byCategory.set(category, []);
    }
    catalog.byCategory.get(category)!.push(skill);

    // Index by agent/owner
    const agentName = skill.owner?.id || deriveAgentName(skill);
    if (!catalog.byAgent.has(agentName)) {
      catalog.byAgent.set(agentName, []);
    }
    catalog.byAgent.get(agentName)!.push(skill);
  }

  catalog.lastRefreshedAt = Date.now();

  // Cache the result
  catalogCache = catalog;
  cacheExpiry = Date.now() + CACHE_TTL_MS;

  return catalog;
}

/**
 * Force a catalog refresh (clears cache).
 */
export function invalidateCatalogCache(): void {
  catalogCache = null;
  cacheExpiry = 0;
}

// ============================================================
// Skill Resolution
// ============================================================

/**
 * Resolve a skill selector (ID or name) to a full skill definition.
 *
 * @param id - The skill ID or name to resolve
 * @returns The skill definition, or null if not found
 */
export async function resolveSkillSelector(
  id: string,
): Promise<SkillDefinition | null> {
  const catalog = await loadSkillCatalog();

  // Try exact ID match first
  const byId = catalog.skills.get(id);
  if (byId) return byId;

  // Try name match (case-insensitive)
  const normalizedId = id.toLowerCase();
  for (const skill of catalog.skills.values()) {
    if (skill.name.toLowerCase() === normalizedId) {
      return skill;
    }
  }

  return null;
}

/**
 * Search skills by query string.
 * Matches against name, description, and activation hints.
 *
 * @param query - The search query
 * @returns Ranked list of matching skill summaries
 */
export async function searchSkills(
  query: string,
): Promise<SkillSummary[]> {
  const catalog = await loadSkillCatalog();
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(Boolean);

  const results: Array<{ skill: SkillSummary; score: number }> = [];

  for (const skill of catalog.skills.values()) {
    let score = 0;

    // Name match (highest weight)
    const nameLower = skill.name.toLowerCase();
    if (nameLower === queryLower) {
      score += 10;
    } else if (nameLower.includes(queryLower)) {
      score += 7;
    } else {
      for (const term of queryTerms) {
        if (nameLower.includes(term)) score += 3;
      }
    }

    // Display name match
    const displayLower = skill.displayName.toLowerCase();
    for (const term of queryTerms) {
      if (displayLower.includes(term)) score += 2;
    }

    // Description match
    const descLower = skill.description.toLowerCase();
    for (const term of queryTerms) {
      if (descLower.includes(term)) score += 1;
    }

    // Activation hints match (high signal)
    if (skill.activationHints) {
      for (const hint of skill.activationHints) {
        const hintLower = hint.toLowerCase();
        for (const term of queryTerms) {
          if (hintLower.includes(term)) score += 4;
        }
        // Full hint match is very strong signal
        if (hintLower === queryLower) {
          score += 8;
        }
      }
    }

    // Avoid-when penalty
    if (skill.avoidWhen) {
      for (const avoid of skill.avoidWhen) {
        if (avoid.toLowerCase().includes(queryLower)) {
          score -= 5;
        }
      }
    }

    if (score > 0) {
      results.push({ skill, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.map((r) => r.skill);
}

/**
 * Get all skills in a specific category.
 *
 * @param category - The category to filter by
 * @returns Skills in that category
 */
export async function getSkillsByCategory(
  category: string,
): Promise<SkillDefinition[]> {
  const catalog = await loadSkillCatalog();
  return catalog.byCategory.get(category) || [];
}

/**
 * Get all skills owned by a specific agent.
 *
 * @param agentName - The agent name
 * @returns Skills owned by that agent
 */
export async function getSkillsByAgent(
  agentName: string,
): Promise<SkillDefinition[]> {
  const catalog = await loadSkillCatalog();
  return catalog.byAgent.get(agentName) || [];
}

/**
 * Get a summary list of all available skills.
 *
 * @returns Array of skill summaries
 */
export async function listAllSkills(): Promise<SkillSummary[]> {
  const catalog = await loadSkillCatalog();
  return Array.from(catalog.skills.values());
}

// ============================================================
// Helpers
// ============================================================

/**
 * Derive a category from a skill's directory path or metadata.
 */
function deriveCategory(skill: SkillDefinition): string {
  // Check frontmatter for explicit category
  if (skill.frontmatter.category && typeof skill.frontmatter.category === 'string') {
    return skill.frontmatter.category;
  }

  // Derive from directory name
  const dirName = skill.directoryPath.split(/[/\\]/).pop() || '';

  // Map common agent directory names to categories
  const categoryMap: Record<string, string> = {
    'orchestrator': 'coordinate',
    'prospect-discovery': 'search',
    'data-enrichment': 'enrich',
    'web-research': 'search',
    'lead-qualification': 'qualify',
    'outreach-composer': 'outreach',
    'pipeline-manager': 'manage',
    'report-generator': 'report',
  };

  return categoryMap[dirName] || 'general';
}

/**
 * Derive an agent name from a skill's directory path.
 */
function deriveAgentName(skill: SkillDefinition): string {
  const dirName = skill.directoryPath.split(/[/\\]/).pop() || '';
  return dirName || skill.name;
}
