/**
 * Vellum Core — Permission & Trust System
 *
 * Adapted from Vellum Assistant's approval/trust architecture for
 * LeadReach AI's B2B lead generation pipeline.
 *
 * Provides:
 *   - Risk classification for tool operations
 *   - Trust rule evaluation with allow/deny/ask patterns
 *   - Workspace-scoping for file operations
 *   - A 10-step DefaultApprovalPolicy decision flow
 *   - Permission checking API
 *
 * This module is ADDITIVE — it does not modify any existing
 * LeadReach permission or authentication systems.
 */

import type { RiskLevel, RiskAssessment, TrustRule, PermissionCheckResult } from './types';

// ============================================================
// Risk Classification
// ============================================================

/**
 * Tools that are classified as low risk — read-only operations
 * that don't modify any state or access sensitive data.
 */
const LOW_RISK_TOOLS = new Set([
  'web_search',
  'company_research',
  'person_research',
  'market_analysis',
  'competitive_analysis',
  'icp_lookup',
  'lead_score_read',
  'pipeline_status',
  'list_tools',
  'health_check',
]);

/**
 * Tools that are classified as medium risk — operations that
 * access potentially sensitive data or make moderate changes.
 */
const MEDIUM_RISK_TOOLS = new Set([
  'email_find',
  'linkedin_search',
  'data_enrich',
  'outreach_compose',
  'deep_crawl',
  'icp_build',
  'lead_score_write',
  'pipeline_update',
  'contact_extract',
]);

/**
 * Tools that are classified as high risk — operations that
 * modify critical data, send communications, or access PII.
 */
const HIGH_RISK_TOOLS = new Set([
  'email_send',
  'linkedin_message',
  'file_write',
  'file_delete',
  'credential_access',
  'api_key_access',
  'bulk_operation',
  'user_data_export',
]);

/**
 * Input patterns that elevate risk level regardless of tool classification.
 * These patterns trigger additional scrutiny.
 */
const ELEVATING_INPUT_PATTERNS: Array<{
  pattern: RegExp;
  reason: string;
  elevation: RiskLevel;
}> = [
  {
    pattern: /password|secret|token|api.key|credential/i,
    reason: 'Input contains sensitive credential references',
    elevation: 'high',
  },
  {
    pattern: /delete|remove|destroy|drop|purge/i,
    reason: 'Input contains destructive operation keywords',
    elevation: 'high',
  },
  {
    pattern: /all\s+(users|leads|contacts|companies)/i,
    reason: 'Input references bulk operations on all records',
    elevation: 'high',
  },
  {
    pattern: /export|download|backup|dump/i,
    reason: 'Input contains data export keywords',
    elevation: 'medium',
  },
  {
    pattern: /personal|private|confidential|internal/i,
    reason: 'Input references private/confidential data',
    elevation: 'medium',
  },
];

/**
 * Classify the risk level of a tool invocation.
 *
 * @param toolName - The name of the tool being invoked
 * @param input - The input parameters for the tool invocation
 * @returns A RiskAssessment with level, reason, and optional rule match
 */
export function classifyRisk(
  toolName: string,
  input: Record<string, unknown>,
): RiskAssessment {
  // Step 1: Check for elevating input patterns first (highest priority)
  const inputStr = JSON.stringify(input);
  for (const { pattern, reason, elevation } of ELEVATING_INPUT_PATTERNS) {
    if (pattern.test(inputStr)) {
      return {
        level: elevation,
        reason,
        matchedRuleId: `input_pattern_${pattern.source.slice(0, 20)}`,
      };
    }
  }

  // Step 2: Check explicit tool classification
  if (HIGH_RISK_TOOLS.has(toolName)) {
    return {
      level: 'high',
      reason: `Tool "${toolName}" is classified as high risk`,
    };
  }

  if (MEDIUM_RISK_TOOLS.has(toolName)) {
    return {
      level: 'medium',
      reason: `Tool "${toolName}" is classified as medium risk`,
    };
  }

  if (LOW_RISK_TOOLS.has(toolName)) {
    return {
      level: 'low',
      reason: `Tool "${toolName}" is classified as low risk`,
    };
  }

  // Step 3: Unknown tools default to medium risk
  return {
    level: 'medium',
    reason: `Tool "${toolName}" has no explicit risk classification — defaulting to medium`,
  };
}

// ============================================================
// Trust Rule Evaluation
// ============================================================

/**
 * Default trust rules for LeadReach AI.
 * These provide a baseline security posture that can be overridden
 * by workspace-specific rules.
 */
const DEFAULT_TRUST_RULES: TrustRule[] = [
  // Allow all low-risk read operations
  {
    id: 'default_allow_reads',
    name: 'Allow Read Operations',
    toolPattern: 'web_search|company_research|person_research|market_analysis|competitive_analysis|icp_lookup|pipeline_status',
    action: 'allow',
    description: 'Allow all read-only research operations',
    priority: 100,
  },
  // Allow medium-risk research tools with no special input
  {
    id: 'default_allow_research',
    name: 'Allow Research Tools',
    toolPattern: 'email_find|linkedin_search|data_enrich|deep_crawl|contact_extract',
    action: 'allow',
    description: 'Allow research and enrichment tools',
    priority: 90,
  },
  // Ask before composing outreach
  {
    id: 'default_ask_outreach',
    name: 'Confirm Outreach Composition',
    toolPattern: 'outreach_compose',
    action: 'ask',
    description: 'Require confirmation before composing outreach messages',
    priority: 80,
  },
  // Deny sending messages without explicit approval
  {
    id: 'default_deny_send',
    name: 'Block Unsolicited Messages',
    toolPattern: 'email_send|linkedin_message',
    action: 'deny',
    description: 'Block sending messages without explicit approval',
    priority: 200,
  },
  // Deny file modifications in production paths
  {
    id: 'default_deny_file_modify',
    name: 'Block File Modifications',
    toolPattern: 'file_write|file_delete',
    action: 'deny',
    description: 'Block file modifications without explicit approval',
    priority: 150,
  },
  // Deny credential access
  {
    id: 'default_deny_credentials',
    name: 'Block Credential Access',
    toolPattern: 'credential_access|api_key_access',
    action: 'deny',
    description: 'Block access to credentials and API keys',
    priority: 200,
  },
];

/**
 * Check if a tool name matches a trust rule's tool pattern.
 * Supports pipe-separated OR patterns (e.g., "file_read|file_write").
 */
function matchesToolPattern(toolName: string, pattern: string): boolean {
  // Split by pipe and check each alternative
  const alternatives = pattern.split('|').map(p => p.trim());
  for (const alt of alternatives) {
    // Support glob-style wildcards
    if (alt.includes('*')) {
      const regex = new RegExp('^' + alt.replace(/\*/g, '.*') + '$');
      if (regex.test(toolName)) return true;
    } else if (alt === toolName) {
      return true;
    }
  }
  return false;
}

/**
 * Check if input matches a trust rule's input pattern.
 */
function matchesInputPattern(
  input: Record<string, unknown>,
  inputPattern: Record<string, unknown> | undefined,
): boolean {
  if (!inputPattern) return true; // No pattern = match all

  for (const [key, value] of Object.entries(inputPattern)) {
    const inputValue = input[key];
    if (value instanceof RegExp) {
      if (typeof inputValue === 'string' && !value.test(inputValue)) return false;
    } else if (typeof value === 'string') {
      if (inputValue !== value) return false;
    }
  }
  return true;
}

/**
 * Check if a path matches a trust rule's path pattern.
 * Used for workspace-scoping file operations.
 */
function matchesPathPattern(
  workingDir: string,
  pathPattern: string | undefined,
  input: Record<string, unknown>,
): boolean {
  if (!pathPattern) return true; // No pattern = match all

  // Check the input for path-related fields
  const pathFields = ['path', 'filePath', 'dir', 'directory', 'workingDir'];
  for (const field of pathFields) {
    const value = input[field];
    if (typeof value === 'string') {
      // Workspace scoping: ensure the path is within the working directory
      const absolutePath = value.startsWith('/') ? value : `${workingDir}/${value}`;
      if (pathPattern.includes('*')) {
        const regex = new RegExp('^' + pathPattern.replace(/\*/g, '.*') + '$');
        if (!regex.test(absolutePath)) return false;
      } else {
        if (!absolutePath.startsWith(pathPattern)) return false;
      }
    }
  }
  return true;
}

// ============================================================
// DefaultApprovalPolicy — 10-Step Decision Flow
// ============================================================

/**
 * The DefaultApprovalPolicy implements a 10-step decision flow for
 * determining whether a tool invocation should be allowed, denied,
 * or requires explicit approval.
 *
 * Steps:
 *  1. Check if the tool is explicitly denied by name
 *  2. Check if the input contains high-risk patterns
 *  3. Evaluate trust rules by priority (highest first)
 *  4. Check workspace path scoping for file operations
 *  5. Classify the inherent risk of the tool
 *  6. Check if the risk level exceeds the session threshold
 *  7. Apply workspace-specific overrides
 *  8. Check for existing approval grants
 *  9. Apply the default action based on risk level
 * 10. Return the final permission check result
 */
export class DefaultApprovalPolicy {
  private readonly sessionRiskThreshold: RiskLevel;
  private readonly customRules: TrustRule[];

  constructor(options?: {
    /** Maximum risk level allowed without explicit approval */
    sessionRiskThreshold?: RiskLevel;
    /** Custom trust rules (merged with defaults, higher priority) */
    customRules?: TrustRule[];
  }) {
    this.sessionRiskThreshold = options?.sessionRiskThreshold || 'medium';
    this.customRules = options?.customRules || [];
  }

  /**
   * Evaluate whether a tool invocation is permitted.
   *
   * Implements the 10-step decision flow:
   */
  checkPermission(
    toolName: string,
    input: Record<string, unknown>,
    workingDir: string,
    trustRules?: TrustRule[],
  ): PermissionCheckResult {
    const allRules = this.mergeRules(trustRules);

    // Step 1: Check if the tool is explicitly denied by name
    for (const rule of allRules) {
      if (rule.action === 'deny' && matchesToolPattern(toolName, rule.toolPattern)) {
        if (matchesInputPattern(input, rule.inputPattern)) {
          return {
            allowed: false,
            riskLevel: 'high',
            reason: `Denied by rule "${rule.name}" (${rule.id})`,
            matchedRuleId: rule.id,
            approvalRequired: false,
          };
        }
      }
    }

    // Step 2: Check if the input contains high-risk patterns
    const riskAssessment = classifyRisk(toolName, input);
    if (riskAssessment.level === 'high' && riskAssessment.matchedRuleId?.startsWith('input_pattern_')) {
      // Input pattern elevation — require approval
      return {
        allowed: false,
        riskLevel: 'high',
        reason: riskAssessment.reason,
        matchedRuleId: riskAssessment.matchedRuleId,
        approvalRequired: true,
      };
    }

    // Step 3: Evaluate trust rules by priority (highest first)
    const sortedRules = [...allRules].sort((a, b) => b.priority - a.priority);
    for (const rule of sortedRules) {
      if (!matchesToolPattern(toolName, rule.toolPattern)) continue;
      if (!matchesInputPattern(input, rule.inputPattern)) continue;
      if (!matchesPathPattern(workingDir, rule.pathPattern, input)) continue;

      // Found a matching rule — return its action
      switch (rule.action) {
        case 'allow':
          return {
            allowed: true,
            riskLevel: riskAssessment.level,
            reason: `Allowed by rule "${rule.name}" (${rule.id})`,
            matchedRuleId: rule.id,
            approvalRequired: false,
          };
        case 'deny':
          return {
            allowed: false,
            riskLevel: riskAssessment.level,
            reason: `Denied by rule "${rule.name}" (${rule.id})`,
            matchedRuleId: rule.id,
            approvalRequired: false,
          };
        case 'ask':
          return {
            allowed: false,
            riskLevel: riskAssessment.level,
            reason: `Requires approval per rule "${rule.name}" (${rule.id})`,
            matchedRuleId: rule.id,
            approvalRequired: true,
          };
      }
    }

    // Step 4: Check workspace path scoping for file operations
    if (!this.isWithinWorkspace(toolName, input, workingDir)) {
      return {
        allowed: false,
        riskLevel: 'high',
        reason: 'Operation targets path outside workspace scope',
        approvalRequired: true,
      };
    }

    // Step 5: Classify the inherent risk of the tool
    const risk = riskAssessment.level;

    // Step 6: Check if the risk level exceeds the session threshold
    if (this.exceedsThreshold(risk)) {
      return {
        allowed: false,
        riskLevel: risk,
        reason: `Tool risk level "${risk}" exceeds session threshold "${this.sessionRiskThreshold}"`,
        approvalRequired: true,
      };
    }

    // Steps 7-8: (Workspace overrides and approval grants would be checked
    // here in a full implementation — for now they fall through to step 9)

    // Step 9: Apply the default action based on risk level
    switch (risk) {
      case 'low':
        return {
          allowed: true,
          riskLevel: 'low',
          reason: 'Low-risk tool — auto-approved',
          approvalRequired: false,
        };
      case 'medium':
        return {
          allowed: true,
          riskLevel: 'medium',
          reason: 'Medium-risk tool — approved with session threshold',
          approvalRequired: false,
        };
      case 'high':
        return {
          allowed: false,
          riskLevel: 'high',
          reason: 'High-risk tool — requires explicit approval',
          approvalRequired: true,
        };
    }
  }

  // ── Private Helpers ────────────────────────────────────────

  /**
   * Merge default rules with custom rules.
   * Custom rules with the same ID override defaults.
   */
  private mergeRules(additionalRules?: TrustRule[]): TrustRule[] {
    const ruleMap = new Map<string, TrustRule>();

    // Start with defaults
    for (const rule of DEFAULT_TRUST_RULES) {
      ruleMap.set(rule.id, rule);
    }

    // Apply instance custom rules
    for (const rule of this.customRules) {
      ruleMap.set(rule.id, rule);
    }

    // Apply call-specific rules
    if (additionalRules) {
      for (const rule of additionalRules) {
        ruleMap.set(rule.id, rule);
      }
    }

    return Array.from(ruleMap.values());
  }

  /**
   * Check if the operation targets a path within the workspace.
   */
  private isWithinWorkspace(
    toolName: string,
    input: Record<string, unknown>,
    workingDir: string,
  ): boolean {
    // Only check path scoping for file-related tools
    const fileTools = ['file_read', 'file_write', 'file_delete', 'file_list'];
    if (!fileTools.includes(toolName)) return true;

    const pathFields = ['path', 'filePath', 'dir', 'directory'];
    for (const field of pathFields) {
      const value = input[field];
      if (typeof value === 'string') {
        const absolutePath = value.startsWith('/') ? value : `${workingDir}/${value}`;
        // Ensure the path is within the working directory
        if (!absolutePath.startsWith(workingDir)) {
          return false;
        }
        // Block path traversal attempts
        if (absolutePath.includes('..')) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if a risk level exceeds the session threshold.
   */
  private exceedsThreshold(risk: RiskLevel): boolean {
    const levels: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };
    return levels[risk] > levels[this.sessionRiskThreshold];
  }
}

// ============================================================
// Convenience Function
// ============================================================

/**
 * Check permission for a tool invocation using the default policy.
 *
 * This is a convenience function that creates a DefaultApprovalPolicy
 * and checks the permission in one call. For repeated checks, create
 * a policy instance directly.
 */
export function checkPermission(
  toolName: string,
  input: Record<string, unknown>,
  workingDir: string,
  trustRules?: TrustRule[],
): PermissionCheckResult {
  const policy = new DefaultApprovalPolicy();
  return policy.checkPermission(toolName, input, workingDir, trustRules);
}
