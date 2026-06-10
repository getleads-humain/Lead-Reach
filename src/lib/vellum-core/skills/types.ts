/**
 * Skills Engine — Type Definitions
 *
 * Adapted from the Vellum Assistant skills architecture for LeadReach AI.
 *
 * Skills are modular capabilities that agents can invoke. Each skill is defined
 * by a SKILL.md file with YAML frontmatter and a markdown body. Skills can
 * optionally declare tools via a TOOLS.json manifest.
 *
 * Skill Sources (in precedence order, lowest to highest):
 *   1. extra     — External plugins loaded at runtime
 *   2. bundled   — Skills shipped with the /agents/ directory
 *   3. plugin    — Skills from registered plugins
 *   4. managed   — Platform-managed skills (remote updates)
 *   5. workspace — User/workspace-specific overrides
 *
 * When two skills have the same name, the higher-precedence source wins.
 */

// ============================================================
// Skill Source & Summary
// ============================================================

/**
 * Where a skill comes from. Higher values override lower ones
 * when two skills share the same name.
 */
export type SkillSource = 'bundled' | 'managed' | 'workspace' | 'plugin' | 'extra';

/**
 * Precedence order for skill sources (higher index = higher precedence).
 * When two skills have the same name, the one from the higher-precedence
 * source wins.
 */
export const SKILL_SOURCE_PRECEDENCE: Record<SkillSource, number> = {
  extra: 0,
  bundled: 1,
  plugin: 2,
  managed: 3,
  workspace: 4,
};

/**
 * A summary of a skill's metadata, without the full body content.
 * Used for catalog listings and search results.
 */
export interface SkillSummary {
  /** Unique skill identifier (e.g., "prospect-discovery") */
  id: string;

  /** Machine-readable skill name (e.g., "prospect-discovery") */
  name: string;

  /** Human-readable display name (e.g., "Prospect Discovery") */
  displayName: string;

  /** Brief description of what this skill does */
  description: string;

  /** Directory path where the skill is located */
  directoryPath: string;

  /** Path to the SKILL.md file */
  skillFilePath: string;

  /** Whether this skill is bundled with the platform */
  bundled?: boolean;

  /** Lucide icon name for UI display */
  icon?: string;

  /** Emoji for quick visual identification */
  emoji?: string;

  /** Where this skill comes from */
  source: SkillSource;

  /** Owner information (which agent/plugin provides this skill) */
  owner?: {
    kind: 'skill' | 'mcp' | 'plugin';
    id: string;
  };

  /** Tool manifest metadata (if TOOLS.json exists) */
  toolManifest?: SkillToolManifestMeta;

  /** List of skill IDs that this skill includes/composes */
  includes?: string[];

  /** Feature flag required to enable this skill (optional) */
  featureFlag?: string;

  /** Keywords/phrases that suggest this skill should be activated */
  activationHints?: string[];

  /** Keywords/phrases that suggest this skill should NOT be activated */
  avoidWhen?: string[];
}

// ============================================================
// Skill Definition (Full)
// ============================================================

/**
 * A complete skill definition, including the full body content
 * parsed from SKILL.md.
 */
export interface SkillDefinition extends SkillSummary {
  /** The full markdown body content (after frontmatter) */
  body: string;

  /** Parsed YAML frontmatter as a raw record */
  frontmatter: Record<string, unknown>;
}

// ============================================================
// Tool Manifest
// ============================================================

/**
 * A TOOLS.json manifest that declares the tools provided by a skill.
 * Tools are executable functions that the skill can invoke.
 */
export interface SkillToolManifest {
  /** Manifest version (currently 1) */
  version: 1;

  /** List of tools declared by this skill */
  tools: SkillToolEntry[];
}

/**
 * A single tool entry in a skill's TOOLS.json manifest.
 */
export interface SkillToolEntry {
  /** Tool name (unique within the skill) */
  name: string;

  /** Human-readable description of what this tool does */
  description: string;

  /** Tool category (e.g., "search", "enrichment", "qualification") */
  category: string;

  /** Risk level — determines permission requirements */
  risk: 'low' | 'medium' | 'high';

  /** JSON Schema for the tool's input parameters */
  input_schema: Record<string, unknown>;

  /** Relative path to the executor script */
  executor: string;

  /** Where the tool executes */
  execution_target: 'host' | 'sandbox';
}

/**
 * Metadata about a skill's tool manifest.
 * Summarizes the TOOLS.json without keeping the full tool definitions.
 */
export interface SkillToolManifestMeta {
  /** Whether a TOOLS.json file was found */
  present: boolean;

  /** Whether the TOOLS.json was valid and parseable */
  valid: boolean;

  /** Number of tools declared in the manifest */
  toolCount: number;

  /** List of tool names declared in the manifest */
  toolNames: string[];

  /** Hash of the manifest content for change detection */
  versionHash?: string;
}

// ============================================================
// Skill Execution
// ============================================================

/**
 * Context provided to a skill during execution.
 * Contains all the information the skill needs to run.
 */
export interface ToolContext {
  /** The agent name executing this skill */
  agentName: string;

  /** The scope ID for memory/context isolation */
  scopeId: string;

  /** Campaign ID (if applicable) */
  campaignId?: string;

  /** Task ID for progress tracking */
  taskId?: string;

  /** Current conversation context */
  conversationContext?: Record<string, unknown>;

  /** User preferences and settings */
  userPreferences?: Record<string, unknown>;

  /** Permission level for this execution */
  permissionLevel: 'read' | 'write' | 'admin';

  /** Execution timeout in milliseconds */
  timeout?: number;
}

/**
 * Result of a skill/tool execution.
 */
export interface ToolExecutionResult {
  /** Whether the execution succeeded */
  success: boolean;

  /** The result data (if successful) */
  data?: Record<string, unknown>;

  /** Error message (if failed) */
  error?: string;

  /** Duration of execution in milliseconds */
  durationMs: number;

  /** Channels accessed during execution */
  channelsUsed?: string[];

  /** Token usage (if LLM was called) */
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * Permission level required to execute a tool, based on risk level.
 */
export const RISK_PERMISSION_MAP: Record<SkillToolEntry['risk'], ToolContext['permissionLevel']> = {
  low: 'read',
  medium: 'write',
  high: 'admin',
};

// ============================================================
// Skill Parsing
// ============================================================

/**
 * Result of parsing a SKILL.md file.
 */
export interface SkillParseResult {
  /** Whether parsing succeeded */
  success: boolean;

  /** The parsed skill definition (if successful) */
  skill?: SkillDefinition;

  /** Validation errors (if any) */
  errors: string[];

  /** Warnings (non-fatal issues) */
  warnings: string[];
}

// ============================================================
// Skill Catalog
// ============================================================

/**
 * The complete skill catalog, organized by source.
 */
export interface SkillCatalog {
  /** All skills, indexed by ID */
  skills: Map<string, SkillDefinition>;

  /** Skills grouped by source */
  bySource: Record<SkillSource, SkillDefinition[]>;

  /** Skills grouped by category */
  byCategory: Map<string, SkillDefinition[]>;

  /** Skills grouped by owner agent */
  byAgent: Map<string, SkillDefinition[]>;

  /** Last refresh timestamp */
  lastRefreshedAt: number;
}
