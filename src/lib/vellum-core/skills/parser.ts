/**
 * Skills Parser — SKILL.md File Parser
 *
 * Parses SKILL.md files with YAML frontmatter (between --- delimiters)
 * and validates required fields.
 *
 * SKILL.md format:
 * ```
 * ---
 * name: prospect-discovery
 * display_name: Prospect Discovery
 * description: Multi-channel parallel search for B2B lead discovery
 * icon: Search
 * emoji: 🔍
 * activation_hints:
 *   - "find companies"
 *   - "search for leads"
 * avoid_when:
 *   - "just chatting"
 * includes:
 *   - web-search
 * feature_flag: null
 * ---
 *
 * # Skill Body
 *
 * Detailed markdown content describing the skill...
 * ```
 *
 * The parser:
 *   1. Splits frontmatter from body at --- delimiters
 *   2. Parses the YAML frontmatter (lightweight, no external YAML library)
 *   3. Validates required fields (name, description)
 *   4. Maps frontmatter keys to SkillDefinition fields
 *   5. Returns the full body as markdown
 */

import type {
  SkillDefinition,
  SkillSummary,
  SkillSource,
  SkillParseResult,
  SkillToolManifestMeta,
} from './types';

// ============================================================
// YAML Frontmatter Parser (Lightweight)
// ============================================================

/**
 * Lightweight YAML parser for SKILL.md frontmatter.
 * Handles basic types: strings, numbers, booleans, null, and arrays.
 * Does NOT support nested objects or complex YAML features.
 *
 * This avoids adding a YAML dependency while covering the
 * frontmatter patterns used in LeadReach's skill files.
 */
function parseSimpleYAML(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let currentKey: string | null = null;
  let currentArray: unknown[] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd(); // Preserve leading whitespace for array detection

    // Skip empty lines and comments
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    // Check for array item (indented line starting with "- ")
    if (currentKey && currentArray !== null && line.match(/^\s+-\s+/)) {
      const value = line.replace(/^\s+-\s+/, '').trim();
      currentArray.push(parseYAMLValue(value));
      continue;
    }

    // Check for key: value pair
    const keyMatch = line.match(/^(\w[\w_-]*):\s*(.*)/);
    if (keyMatch) {
      // Save previous array if exists
      if (currentKey && currentArray !== null) {
        result[currentKey] = currentArray;
      }

      currentKey = keyMatch[1];
      const valueStr = keyMatch[2].trim();

      if (valueStr === '' || valueStr === '|' || valueStr === '>') {
        // Value is either empty (might be array on next lines) or multiline
        currentArray = [];
        result[currentKey] = [];
      } else {
        result[currentKey] = parseYAMLValue(valueStr);
        currentArray = null;
      }
    }
  }

  // Save last array if exists
  if (currentKey && currentArray !== null) {
    result[currentKey] = currentArray;
  }

  return result;
}

/**
 * Parse a single YAML value string into a JS value.
 */
function parseYAMLValue(value: string): unknown {
  // Handle quoted strings
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  // Handle null
  if (value === 'null' || value === '~' || value === '') {
    return null;
  }

  // Handle booleans
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // Handle numbers
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

  // Handle inline arrays: [item1, item2, item3]
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => parseYAMLValue(item.trim()));
  }

  // Default: string
  return value;
}

// ============================================================
// Frontmatter Extraction
// ============================================================

/**
 * Extract frontmatter and body from a SKILL.md file content.
 *
 * Frontmatter is delimited by --- at the start and end.
 * Everything before the first --- is ignored.
 * Everything between the first and second --- is frontmatter.
 * Everything after the second --- is the body.
 *
 * @param content - The full file content
 * @returns Object with frontmatter string and body string
 */
function extractFrontmatter(
  content: string,
): { frontmatter: string; body: string } {
  // Match --- at the start of the file (possibly after whitespace)
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    // No frontmatter found — entire content is body
    return {
      frontmatter: '',
      body: content.trim(),
    };
  }

  return {
    frontmatter: match[1],
    body: content.slice(match[0].length).trim(),
  };
}

// ============================================================
// Field Mapping
// ============================================================

/**
 * Map of frontmatter key names (in SKILL.md) to SkillDefinition field names.
 * Handles both snake_case (YAML convention) and camelCase alternatives.
 */
const FIELD_ALIASES: Record<string, string> = {
  // Core fields
  name: 'name',
  display_name: 'displayName',
  displayName: 'displayName',
  description: 'description',
  desc: 'description',

  // Visual
  icon: 'icon',
  emoji: 'emoji',

  // Organization
  category: 'category',
  includes: 'includes',

  // Activation
  activation_hints: 'activationHints',
  activationHints: 'activationHints',
  hints: 'activationHints',
  avoid_when: 'avoidWhen',
  avoidWhen: 'avoidWhen',
  avoid: 'avoidWhen',

  // Feature flags
  feature_flag: 'featureFlag',
  featureFlag: 'featureFlag',

  // Owner
  owner: 'owner',
  source: 'source',

  // Version
  version: 'version',
};

/**
 * Map raw frontmatter to typed skill fields.
 */
function mapFrontmatter(
  raw: Record<string, unknown>,
): Partial<SkillSummary> {
  const mapped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    const mappedKey = FIELD_ALIASES[key];
    if (mappedKey) {
      mapped[mappedKey] = value;
    }
  }

  return mapped as Partial<SkillSummary>;
}

// ============================================================
// Validation
// ============================================================

/**
 * Validate a parsed skill definition.
 * Ensures required fields are present and properly typed.
 */
function validateSkill(
  partial: Partial<SkillSummary>,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!partial.name || typeof partial.name !== 'string' || partial.name.trim() === '') {
    errors.push('Missing required field: name');
  }

  if (!partial.description || typeof partial.description !== 'string' || partial.description.trim() === '') {
    errors.push('Missing required field: description');
  }

  // Warnings for recommended fields
  if (!partial.displayName) {
    warnings.push('No display_name specified — using name as fallback');
  }

  if (!partial.activationHints || !Array.isArray(partial.activationHints) || partial.activationHints.length === 0) {
    warnings.push('No activation_hints specified — skill may not be discoverable via keyword matching');
  }

  // Validate name format (lowercase, hyphens only)
  if (partial.name && !/^[a-z][a-z0-9-]*$/.test(partial.name)) {
    warnings.push(
      `Skill name "${partial.name}" doesn't follow convention (lowercase, hyphens, starts with letter)`,
    );
  }

  return { errors, warnings };
}

// ============================================================
// Tool Manifest Detection
// ============================================================

/**
 * Check for a TOOLS.json manifest in the same directory as the skill file.
 * Since we can't do filesystem reads in this module (it runs on server),
 * this creates a placeholder manifest meta that can be filled in by the catalog.
 *
 * @param directoryPath - The directory where the skill file is located
 * @returns Placeholder manifest metadata
 */
function createDefaultManifestMeta(directoryPath: string): SkillToolManifestMeta {
  // The actual TOOLS.json reading happens in the catalog module
  // which has filesystem access. Here we just create a default.
  return {
    present: false,
    valid: false,
    toolCount: 0,
    toolNames: [],
  };
}

// ============================================================
// Public API
// ============================================================

/**
 * Parse a SKILL.md file content into a SkillDefinition.
 *
 * @param content   - The full file content (frontmatter + body)
 * @param filePath  - The file path (for metadata and debugging)
 * @param source    - The skill source (default: 'bundled')
 * @returns Parse result with the skill definition or errors
 */
export function parseSkillFile(
  content: string,
  filePath: string,
  source: SkillSource = 'bundled',
): SkillParseResult {
  try {
    // Extract frontmatter and body
    const { frontmatter, body } = extractFrontmatter(content);

    // Parse frontmatter
    const rawFrontmatter = frontmatter
      ? parseSimpleYAML(frontmatter)
      : {};

    // Map to typed fields
    const mappedFields = mapFrontmatter(rawFrontmatter);

    // Derive ID and paths
    const name = mappedFields.name || '';
    const id = name.toLowerCase().replace(/\s+/g, '-');

    // Derive directory path from file path
    const directoryPath = filePath.substring(0, filePath.lastIndexOf('/')) || filePath.substring(0, filePath.lastIndexOf('\\')) || '';

    // Build the skill summary
    const summary: Partial<SkillSummary> = {
      id,
      name,
      displayName: mappedFields.displayName || name
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      description: mappedFields.description || '',
      directoryPath,
      skillFilePath: filePath,
      bundled: source === 'bundled',
      icon: mappedFields.icon,
      emoji: mappedFields.emoji,
      source,
      toolManifest: createDefaultManifestMeta(directoryPath),
      includes: Array.isArray(mappedFields.includes)
        ? mappedFields.includes as string[]
        : undefined,
      featureFlag: mappedFields.featureFlag as string | undefined,
      activationHints: Array.isArray(mappedFields.activationHints)
        ? mappedFields.activationHints as string[]
        : undefined,
      avoidWhen: Array.isArray(mappedFields.avoidWhen)
        ? mappedFields.avoidWhen as string[]
        : undefined,
    };

    // Validate
    const { errors, warnings } = validateSkill(summary);

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        warnings,
      };
    }

    // Build the full definition
    const definition: SkillDefinition = {
      ...(summary as SkillSummary),
      body,
      frontmatter: rawFrontmatter,
    };

    return {
      success: true,
      skill: definition,
      errors: [],
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        `Failed to parse skill file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      warnings: [],
    };
  }
}

/**
 * Parse an agent.md file (from the /agents/ directory) as a skill.
 * Agent files follow a similar frontmatter pattern but may have
 * different field names.
 *
 * @param content   - The agent.md file content
 * @param filePath  - The file path
 * @returns Parse result
 */
export function parseAgentFile(
  content: string,
  filePath: string,
): SkillParseResult {
  // Extract the agent name from the directory path
  const pathParts = filePath.split(/[/\\]/);
  const agentDirName = pathParts[pathParts.length - 2] || 'unknown';

  // Try to parse as a standard skill file first
  const result = parseSkillFile(content, filePath, 'bundled');

  // If parsing failed (no frontmatter), create a minimal skill from the content
  if (!result.success || !result.skill) {
    // Extract a description from the first line or paragraph
    const firstLine = content
      .split('\n')
      .find((l) => l.trim().length > 0 && !l.trim().startsWith('#')) || '';

    const agentName = agentDirName;
    const id = agentName.toLowerCase().replace(/\s+/g, '-');

    // Create a synthetic skill from the agent
    const definition: SkillDefinition = {
      id,
      name: agentName,
      displayName: agentName
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      description: firstLine.slice(0, 200).trim() || `Agent: ${agentName}`,
      directoryPath: filePath.substring(0, filePath.lastIndexOf('/')) || '',
      skillFilePath: filePath,
      bundled: true,
      source: 'bundled',
      body: content,
      frontmatter: {},
      activationHints: [agentName],
    };

    return {
      success: true,
      skill: definition,
      errors: [],
      warnings: ['No YAML frontmatter found — created synthetic skill from agent file'],
    };
  }

  return result;
}
