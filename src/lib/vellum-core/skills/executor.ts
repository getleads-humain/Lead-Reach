/**
 * Skills Executor — Skill Execution Engine
 *
 * Executes skills by:
 *   1. Resolving the skill ID to a full definition
 *   2. Loading the TOOLS.json manifest (if present)
 *   3. Finding the matching tool entry for the requested operation
 *   4. Checking permissions (risk → permission level mapping)
 *   5. Executing the tool with timeout and error handling
 *
 * Execution Modes:
 *   - **Direct execution**: Skill body contains instructions that are
 *     interpreted by the calling agent (LLM-powered execution).
 *   - **Tool execution**: Skill declares tools in TOOLS.json, which
 *     are executed as scripted functions.
 *
 * For LeadReach AI, most skills are LLM-powered — the skill body provides
 * the system prompt and instructions, and the agent executor calls the LLM.
 * Tool execution is supported for skills that declare TOOLS.json manifests.
 */

import type {
  SkillDefinition,
  SkillToolEntry,
  ToolContext,
  ToolExecutionResult,
} from './types';
import { RISK_PERMISSION_MAP } from './types';
import { resolveSkillSelector } from './catalog';

// ============================================================
// Execution Error Types
// ============================================================

/**
 * Custom error for skill execution failures.
 */
export class SkillExecutionError extends Error {
  public readonly skillId: string;
  public readonly toolName?: string;
  public readonly code: string;

  constructor(params: {
    skillId: string;
    toolName?: string;
    code: string;
    message: string;
  }) {
    super(params.message);
    this.name = 'SkillExecutionError';
    this.skillId = params.skillId;
    this.toolName = params.toolName;
    this.code = params.code;
  }
}

// ============================================================
// Permission Checking
// ============================================================

/**
 * Check if the current context has sufficient permissions
 * to execute a tool with the given risk level.
 *
 * @param risk     - The tool's risk level
 * @param context  - The execution context with permission level
 * @returns Whether execution is permitted
 */
function checkPermission(
  risk: SkillToolEntry['risk'],
  context: ToolContext,
): boolean {
  const requiredLevel = RISK_PERMISSION_MAP[risk];
  const permissionLevels: Array<ToolContext['permissionLevel']> = [
    'read',
    'write',
    'admin',
  ];

  const contextLevel = permissionLevels.indexOf(context.permissionLevel);
  const requiredLevelIndex = permissionLevels.indexOf(requiredLevel);

  return contextLevel >= requiredLevelIndex;
}

// ============================================================
// Tool Resolution
// ============================================================

/**
 * Find a tool in a skill's manifest by name.
 *
 * @param skill    - The skill definition
 * @param toolName - The tool name to find
 * @returns The tool entry, or null if not found
 */
function resolveTool(
  skill: SkillDefinition,
  toolName: string,
): SkillToolEntry | null {
  // Check if the skill has a valid tool manifest
  if (!skill.toolManifest?.present || !skill.toolManifest.valid) {
    return null;
  }

  // The manifest should have been loaded by the catalog.
  // For now, we need to load it on demand.
  // This is a simplification — in production, the catalog would
  // have already parsed and stored the full manifest.
  return null; // Will be loaded dynamically in executeTool
}

// ============================================================
// Skill Execution
// ============================================================

/**
 * Execute a skill by ID.
 *
 * This is the main entry point for skill execution. It:
 *   1. Resolves the skill ID to a definition
 *   2. Validates the context and permissions
 *   3. Executes the skill's primary function
 *   4. Returns the execution result
 *
 * For LLM-powered skills (most LeadReach skills), execution means
 * returning the skill body and configuration so the agent executor
 * can use it as a system prompt template.
 *
 * For tool-based skills, execution means finding and running the
 * appropriate tool from the TOOLS.json manifest.
 *
 * @param skillId - The skill ID to execute
 * @param input   - Input parameters for the skill
 * @param context - Execution context with permissions and settings
 * @returns Execution result
 */
export async function executeSkill(
  skillId: string,
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolExecutionResult> {
  const startTime = Date.now();

  try {
    // 1. Resolve the skill
    const skill = await resolveSkillSelector(skillId);
    if (!skill) {
      throw new SkillExecutionError({
        skillId,
        code: 'SKILL_NOT_FOUND',
        message: `Skill "${skillId}" not found in catalog`,
      });
    }

    // 2. Check feature flag (if applicable)
    if (skill.featureFlag) {
      // In production, check against feature flag service
      // For now, all feature flags are considered enabled
      const enabled = true; // await checkFeatureFlag(skill.featureFlag, context.scopeId);
      if (!enabled) {
        throw new SkillExecutionError({
          skillId,
          code: 'FEATURE_FLAG_DISABLED',
          message: `Skill "${skill.name}" requires feature flag "${skill.featureFlag}" which is not enabled`,
        });
      }
    }

    // 3. Check activation hints / avoid-when
    if (skill.avoidWhen && input._query) {
      const query = String(input._query).toLowerCase();
      for (const avoid of skill.avoidWhen) {
        if (query.includes(avoid.toLowerCase())) {
          throw new SkillExecutionError({
            skillId,
            code: 'AVOID_CONDITION_MET',
            message: `Skill "${skill.name}" should be avoided when query matches "${avoid}"`,
          });
        }
      }
    }

    // 4. Determine execution mode
    const hasTools = skill.toolManifest?.present && skill.toolManifest.valid;

    if (hasTools && input._toolName) {
      // Tool-based execution
      return await executeTool(skill, String(input._toolName), input, context);
    }

    // 5. LLM-powered skill execution (default)
    // Return the skill body and metadata for the agent executor to use
    return {
      success: true,
      data: {
        skillId: skill.id,
        skillName: skill.name,
        displayName: skill.displayName,
        description: skill.description,
        body: skill.body,
        frontmatter: skill.frontmatter,
        input,
        agentName: context.agentName,
        scopeId: context.scopeId,
        campaignId: context.campaignId,
      },
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    if (error instanceof SkillExecutionError) {
      return {
        success: false,
        error: error.message,
        durationMs: Date.now() - startTime,
      };
    }

    return {
      success: false,
      error: `Unexpected error executing skill "${skillId}": ${error instanceof Error ? error.message : 'Unknown'}`,
      durationMs: Date.now() - startTime,
    };
  }
}

// ============================================================
// Tool Execution
// ============================================================

/**
 * Execute a specific tool from a skill's TOOLS.json manifest.
 *
 * @param skill    - The skill definition
 * @param toolName - The name of the tool to execute
 * @param input    - Input parameters
 * @param context  - Execution context
 * @returns Execution result
 */
async function executeTool(
  skill: SkillDefinition,
  toolName: string,
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  const timeout = context.timeout || 30000; // Default 30s timeout

  try {
    // Load the tool manifest
    const manifest = await loadToolManifestForSkill(skill);
    if (!manifest) {
      throw new SkillExecutionError({
        skillId: skill.id,
        toolName,
        code: 'MANIFEST_NOT_FOUND',
        message: `No valid TOOLS.json manifest found for skill "${skill.name}"`,
      });
    }

    // Find the requested tool
    const tool = manifest.tools.find((t) => t.name === toolName);
    if (!tool) {
      throw new SkillExecutionError({
        skillId: skill.id,
        toolName,
        code: 'TOOL_NOT_FOUND',
        message: `Tool "${toolName}" not found in skill "${skill.name}". Available: ${manifest.tools.map((t) => t.name).join(', ')}`,
      });
    }

    // Check permissions
    if (!checkPermission(tool.risk, context)) {
      throw new SkillExecutionError({
        skillId: skill.id,
        toolName,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Tool "${toolName}" requires ${RISK_PERMISSION_MAP[tool.risk]} permission, but context has ${context.permissionLevel}`,
      });
    }

    // Validate input against schema (basic check)
    if (tool.input_schema && tool.input_schema.required) {
      const required = tool.input_schema.required as string[];
      for (const field of required) {
        if (!(field in input) || input[field] === undefined || input[field] === null) {
          throw new SkillExecutionError({
            skillId: skill.id,
            toolName,
            code: 'MISSING_REQUIRED_INPUT',
            message: `Tool "${toolName}" requires input field "${field}"`,
          });
        }
      }
    }

    // Execute with timeout
    const result = await executeWithTimeout(
      () => runToolExecutor(skill, tool, input, context),
      timeout,
    );

    return {
      success: true,
      data: result,
      durationMs: Date.now() - startTime,
      channelsUsed: extractChannelsUsed(tool),
    };
  } catch (error) {
    if (error instanceof SkillExecutionError) {
      return {
        success: false,
        error: error.message,
        durationMs: Date.now() - startTime,
      };
    }

    // Timeout error
    if (error instanceof Error && error.message.includes('timed out')) {
      return {
        success: false,
        error: `Tool "${toolName}" timed out after ${timeout}ms`,
        durationMs: Date.now() - startTime,
      };
    }

    return {
      success: false,
      error: `Unexpected error executing tool "${toolName}": ${error instanceof Error ? error.message : 'Unknown'}`,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Load the full tool manifest for a skill.
 * Since the catalog only stores metadata, we need to re-read TOOLS.json
 * to get the full tool definitions.
 */
async function loadToolManifestForSkill(
  skill: SkillDefinition,
): Promise<import('./types').SkillToolManifest | null> {
  try {
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');
    const manifestPath = join(skill.directoryPath, 'TOOLS.json');
    const content = await readFile(manifestPath, 'utf-8');
    return JSON.parse(content) as import('./types').SkillToolManifest;
  } catch {
    return null;
  }
}

/**
 * Run a tool's executor script.
 *
 * In the current implementation, most tools are LLM-powered
 * and don't have separate executor scripts. This function
 * returns the tool configuration for the agent executor
 * to handle.
 */
async function runToolExecutor(
  skill: SkillDefinition,
  tool: SkillToolEntry,
  input: Record<string, unknown>,
  _context: ToolContext,
): Promise<Record<string, unknown>> {
  // For now, return the tool configuration and input
  // The actual execution is handled by the agent executor
  // which uses the LLM to process the tool's description
  // and input schema.
  return {
    toolName: tool.name,
    toolDescription: tool.description,
    toolCategory: tool.category,
    toolRisk: tool.risk,
    toolInput: input,
    skillId: skill.id,
    skillName: skill.name,
    executor: tool.executor,
    executionTarget: tool.execution_target,
  };
}

/**
 * Extract channel names used by a tool.
 * Based on the tool's category and description.
 */
function extractChannelsUsed(tool: SkillToolEntry): string[] {
  const channels: string[] = [];

  const category = tool.category.toLowerCase();
  const desc = tool.description.toLowerCase();

  // Map categories to channels
  if (category.includes('search') || desc.includes('search')) {
    channels.push('web_search');
  }
  if (desc.includes('linkedin')) {
    channels.push('linkedin');
  }
  if (desc.includes('twitter') || desc.includes('x.com')) {
    channels.push('twitter');
  }
  if (desc.includes('reddit')) {
    channels.push('reddit');
  }
  if (desc.includes('github')) {
    channels.push('github');
  }
  if (desc.includes('youtube')) {
    channels.push('youtube');
  }
  if (desc.includes('web') || desc.includes('scrape') || desc.includes('read')) {
    channels.push('web');
  }

  return channels;
}

// ============================================================
// Timeout Helper
// ============================================================

/**
 * Execute a function with a timeout.
 *
 * @param fn      - The function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @returns The function's return value
 * @throws Error if the function times out
 */
async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// ============================================================
// Batch Execution
// ============================================================

/**
 * Execute multiple skills in sequence, stopping on first failure.
 *
 * @param skills  - Array of { skillId, input } objects
 * @param context - Shared execution context
 * @returns Array of execution results
 */
export async function executeSkillChain(
  skills: Array<{ skillId: string; input: Record<string, unknown> }>,
  context: ToolContext,
): Promise<ToolExecutionResult[]> {
  const results: ToolExecutionResult[] = [];

  for (const { skillId, input } of skills) {
    const result = await executeSkill(skillId, input, context);
    results.push(result);

    if (!result.success) {
      // Stop chain on failure
      break;
    }
  }

  return results;
}

/**
 * Execute multiple skills in parallel.
 *
 * @param skills  - Array of { skillId, input } objects
 * @param context - Shared execution context
 * @returns Array of execution results (in same order as input)
 */
export async function executeSkillsParallel(
  skills: Array<{ skillId: string; input: Record<string, unknown> }>,
  context: ToolContext,
): Promise<ToolExecutionResult[]> {
  const promises = skills.map(({ skillId, input }) =>
    executeSkill(skillId, input, context),
  );

  return Promise.all(promises);
}
