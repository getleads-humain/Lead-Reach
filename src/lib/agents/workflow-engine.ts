/**
 * Workflow Engine
 *
 * Orchestrates complex multi-agent workflows with dependencies, conditions,
 * and real-time progress tracking. This is the "conductor" that ensures
 * agents work together in precisely choreographed sequences.
 *
 * Capabilities:
 * - Define multi-step workflows with agent assignments
 * - Support dependencies between steps (sequential, parallel, conditional)
 * - Real-time progress tracking and status updates
 * - Error handling with retry logic and fallback steps
 * - Workflow templates for common sales processes
 * - Sub-workflow support for modular composition
 */

import { db } from '../db';
import type { AgentName } from '../types';

// ============================================================
// Types
// ============================================================

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting';
export type StepCondition = 'always' | 'on_success' | 'on_failure' | 'on_any';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  agentName: AgentName;
  taskType: string;
  input: Record<string, unknown>;
  dependsOn: string[]; // Step IDs this depends on
  condition: StepCondition; // When to run this step
  retryCount: number;
  maxRetries: number;
  timeoutMs: number;
  status: StepStatus;
  taskId?: string; // The AgentTask ID when executed
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  version: string;
  category: string;
}

export interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: WorkflowStatus;
  campaignId?: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

// ============================================================
// Workflow Templates
// ============================================================

/**
 * Full Sales Pipeline Workflow
 * Discovery → Enrichment → Qualification → Outreach → Follow-up
 */
export function createFullPipelineWorkflow(params: {
  campaignId: string;
  industry: string;
  location: string;
  companySize?: string;
  maxLeads?: number;
}): WorkflowDefinition {
  return {
    id: `pipeline-${Date.now()}`,
    name: 'Full Sales Pipeline',
    description: `Complete pipeline for ${params.industry} in ${params.location}`,
    version: '2.0',
    category: 'sales-pipeline',
    steps: [
      {
        id: 'discovery',
        name: 'Prospect Discovery',
        description: `Search for ${params.industry} companies in ${params.location}`,
        agentName: 'prospect-discovery',
        taskType: 'search',
        input: {
          industry: params.industry,
          location: params.location,
          companySize: params.companySize,
          maxLeads: params.maxLeads || 20,
          campaignId: params.campaignId,
        },
        dependsOn: [],
        condition: 'always',
        retryCount: 0,
        maxRetries: 2,
        timeoutMs: 120000,
        status: 'pending',
      },
      {
        id: 'enrichment',
        name: 'Data Enrichment',
        description: 'Enrich discovered leads with firmographics, contacts, and digital presence',
        agentName: 'data-enrichment',
        taskType: 'enrich',
        input: {
          campaignId: params.campaignId,
          enrichAll: true,
          useKPIDiscovery: true,
        },
        dependsOn: ['discovery'],
        condition: 'on_success',
        retryCount: 0,
        maxRetries: 2,
        timeoutMs: 180000,
        status: 'pending',
      },
      {
        id: 'qualification',
        name: 'Lead Qualification',
        description: 'Score and qualify leads using BANT + MEDDIC frameworks',
        agentName: 'lead-qualification',
        taskType: 'qualify',
        input: {
          campaignId: params.campaignId,
          framework: 'bant_meddic',
          minScore: 40,
        },
        dependsOn: ['enrichment'],
        condition: 'on_success',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 120000,
        status: 'pending',
      },
      {
        id: 'outreach',
        name: 'Outreach Composition',
        description: 'Craft personalized outreach for qualified leads',
        agentName: 'outreach-composer',
        taskType: 'outreach',
        input: {
          campaignId: params.campaignId,
          minTier: 'warm',
          channels: ['email', 'linkedin'],
          framework: 'observation_connection_ask',
        },
        dependsOn: ['qualification'],
        condition: 'on_success',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 120000,
        status: 'pending',
      },
      {
        id: 'pipeline-management',
        name: 'Pipeline Update',
        description: 'Update pipeline stages and schedule follow-ups',
        agentName: 'pipeline-manager',
        taskType: 'coordinate',
        input: {
          campaignId: params.campaignId,
          action: 'update_stages_and_followups',
        },
        dependsOn: ['outreach'],
        condition: 'on_any',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 60000,
        status: 'pending',
      },
      {
        id: 'report',
        name: 'Pipeline Report',
        description: 'Generate campaign performance report',
        agentName: 'report-generator',
        taskType: 'report',
        input: {
          campaignId: params.campaignId,
          reportType: 'pipeline_summary',
        },
        dependsOn: ['pipeline-management'],
        condition: 'on_any',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 60000,
        status: 'pending',
      },
    ],
  };
}

/**
 * Single Prospect Deep Analysis Workflow
 * Research → Score → Contacts → Outreach Prep
 */
export function createProspectAnalysisWorkflow(params: {
  companyName: string;
  website?: string;
  campaignId?: string;
}): WorkflowDefinition {
  return {
    id: `prospect-${Date.now()}`,
    name: 'Deep Prospect Analysis',
    description: `Thorough analysis of ${params.companyName}`,
    version: '2.0',
    category: 'prospect-analysis',
    steps: [
      {
        id: 'research',
        name: 'Company Research',
        description: `Deep research on ${params.companyName}`,
        agentName: 'web-research',
        taskType: 'research',
        input: {
          companyName: params.companyName,
          website: params.website,
          researchDepth: 'deep',
          dimensions: ['overview', 'business_model', 'product_tech', 'leadership', 'funding', 'market_position', 'culture', 'recent_developments'],
        },
        dependsOn: [],
        condition: 'always',
        retryCount: 0,
        maxRetries: 2,
        timeoutMs: 180000,
        status: 'pending',
      },
      {
        id: 'competitive',
        name: 'Competitive Intelligence',
        description: `Analyze competitive position of ${params.companyName}`,
        agentName: 'web-research',
        taskType: 'competitive',
        input: {
          companyName: params.companyName,
          website: params.website,
          analysisType: 'battle_card',
        },
        dependsOn: ['research'],
        condition: 'on_success',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 120000,
        status: 'pending',
      },
      {
        id: 'scoring',
        name: 'BANT + MEDDIC Scoring',
        description: 'Score lead using BANT and MEDDIC frameworks',
        agentName: 'lead-qualification',
        taskType: 'qualify',
        input: {
          companyName: params.companyName,
          framework: 'bant_meddic_prospect',
          campaignId: params.campaignId,
        },
        dependsOn: ['research'],
        condition: 'on_success',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 90000,
        status: 'pending',
      },
      {
        id: 'outreach-prep',
        name: 'Outreach Preparation',
        description: 'Prepare personalized outreach based on research and scoring',
        agentName: 'outreach-composer',
        taskType: 'outreach',
        input: {
          companyName: params.companyName,
          campaignId: params.campaignId,
          framework: 'problem_proof_ask',
          includeMeetingPrep: true,
        },
        dependsOn: ['scoring', 'competitive'],
        condition: 'on_success',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 120000,
        status: 'pending',
      },
    ],
  };
}

/**
 * Lead Nurturing Workflow
 * For warm/cold leads that need sustained engagement
 */
export function createNurturingWorkflow(params: {
  campaignId: string;
  minTier?: string;
  maxSteps?: number;
}): WorkflowDefinition {
  return {
    id: `nurture-${Date.now()}`,
    name: 'Lead Nurturing Campaign',
    description: 'Multi-touch nurturing sequence for warm/cold leads',
    version: '1.0',
    category: 'nurturing',
    steps: [
      {
        id: 'identify-nurture-leads',
        name: 'Identify Nurture Leads',
        description: 'Find leads that need nurturing',
        agentName: 'pipeline-manager',
        taskType: 'coordinate',
        input: {
          campaignId: params.campaignId,
          action: 'identify_nurture_targets',
          minTier: params.minTier || 'cold',
        },
        dependsOn: [],
        condition: 'always',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 30000,
        status: 'pending',
      },
      {
        id: 'nurture-outreach',
        name: 'Nurture Outreach',
        description: 'Create value-add nurture messages',
        agentName: 'outreach-composer',
        taskType: 'outreach',
        input: {
          campaignId: params.campaignId,
          outreachType: 'nurture',
          framework: 'trigger_event',
          channels: ['email'],
        },
        dependsOn: ['identify-nurture-leads'],
        condition: 'on_success',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 120000,
        status: 'pending',
      },
      {
        id: 'schedule-followups',
        name: 'Schedule Follow-ups',
        description: 'Schedule multi-touch follow-up sequence',
        agentName: 'pipeline-manager',
        taskType: 'coordinate',
        input: {
          campaignId: params.campaignId,
          action: 'schedule_nurture_sequence',
          maxSteps: params.maxSteps || 5,
          intervalDays: 7,
        },
        dependsOn: ['nurture-outreach'],
        condition: 'on_success',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 30000,
        status: 'pending',
      },
    ],
  };
}

// ============================================================
// Workflow Execution Engine
// ============================================================

/**
 * Execute a workflow definition.
 * Runs steps respecting dependencies and conditions.
 */
export async function executeWorkflow(
  workflow: WorkflowDefinition,
  campaignId?: string,
): Promise<WorkflowExecution> {
  const execution: WorkflowExecution = {
    id: `wf-exec-${Date.now()}`,
    workflowName: workflow.name,
    status: 'running',
    campaignId,
    steps: workflow.steps.map(s => ({ ...s })),
    currentStepIndex: 0,
    startedAt: new Date().toISOString(),
    metadata: {},
  };

  // Store the execution state
  await storeWorkflowExecution(execution);

  try {
    const stepMap = new Map(execution.steps.map(s => [s.id, s]));
    const completedSteps = new Set<string>();
    const failedSteps = new Set<string>();

    // Process steps in dependency order
    let stepsProcessed = 0;
    const maxIterations = execution.steps.length * 2; // Safety limit

    while (stepsProcessed < execution.steps.length && maxIterations > 0) {
      let progressMade = false;

      for (const step of execution.steps) {
        if (step.status !== 'pending') continue;

        // Check if dependencies are met
        const depsMet = step.dependsOn.every(depId => {
          const depStep = stepMap.get(depId);
          if (!depStep) return false;
          return depStep.status === 'completed' || depStep.status === 'skipped';
        });

        if (!depsMet) continue;

        // Check if any dependency failed and this step requires success
        const anyDepFailed = step.dependsOn.some(depId => failedSteps.has(depId));
        if (anyDepFailed && step.condition === 'on_success') {
          step.status = 'skipped';
          stepsProcessed++;
          progressMade = true;
          continue;
        }

        // Execute the step
        step.status = 'running';
        step.startedAt = new Date().toISOString();
        await storeWorkflowExecution(execution);

        try {
          const result = await executeWorkflowStep(step, campaignId);
          step.output = result.output;
          step.taskId = result.taskId;
          step.status = 'completed';
          step.completedAt = new Date().toISOString();
          completedSteps.add(step.id);
          stepsProcessed++;
          progressMade = true;
        } catch (error) {
          step.error = error instanceof Error ? error.message : 'Unknown error';
          step.status = 'failed';
          step.completedAt = new Date().toISOString();
          failedSteps.add(step.id);

          // Retry logic
          if (step.retryCount < step.maxRetries) {
            step.retryCount++;
            step.status = 'pending'; // Reset for retry
          } else {
            stepsProcessed++;
          }
          progressMade = true;
        }

        await storeWorkflowExecution(execution);
      }

      if (!progressMade) {
        // Deadlock detection - some steps can't run
        const stuckSteps = execution.steps.filter(s => s.status === 'pending');
        for (const step of stuckSteps) {
          step.status = 'failed';
          step.error = 'Deadlock detected: unresolvable dependencies';
          stepsProcessed++;
        }
        break;
      }
    }

    // Determine final status
    const hasFailures = execution.steps.some(s => s.status === 'failed');
    const hasCompleted = execution.steps.some(s => s.status === 'completed');

    execution.status = hasFailures && !hasCompleted ? 'failed'
      : hasFailures ? 'completed'
      : 'completed';
    execution.completedAt = new Date().toISOString();

    await storeWorkflowExecution(execution);
    return execution;
  } catch (error) {
    execution.status = 'failed';
    execution.error = error instanceof Error ? error.message : 'Unknown error';
    execution.completedAt = new Date().toISOString();
    await storeWorkflowExecution(execution);
    return execution;
  }
}

/**
 * Execute a single workflow step by dispatching to the agent system.
 */
async function executeWorkflowStep(
  step: WorkflowStep,
  campaignId?: string,
): Promise<{ taskId: string; output: Record<string, unknown> }> {
  // Create an AgentTask for this step
  const task = await db.agentTask.create({
    data: {
      agentName: step.agentName,
      taskType: step.taskType,
      campaignId: campaignId || null,
      priority: 8,
      input: JSON.stringify({
        ...step.input,
        stepName: step.name,
        stepDescription: step.description,
      }),
      status: 'pending',
    },
  });

  // Execute the task using the agent executor
  const { executeTask } = await import('../agent-executor');
  const result = await executeTask(task.id);

  return {
    taskId: task.id,
    output: result.output || {},
  };
}

/**
 * Store workflow execution state in the database.
 */
async function storeWorkflowExecution(execution: WorkflowExecution): Promise<void> {
  // Store as a special AgentTask with type 'workflow'
  const existingTask = await db.agentTask.findFirst({
    where: {
      taskType: 'workflow',
      input: `workflow:${execution.id}`,
    },
  });

  const data = {
    agentName: 'orchestrator' as AgentName,
    taskType: 'workflow',
    status: execution.status,
    priority: 10,
    input: `workflow:${execution.id}`,
    output: JSON.stringify({
      workflowName: execution.workflowName,
      campaignId: execution.campaignId,
      steps: execution.steps,
      currentStepIndex: execution.currentStepIndex,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      error: execution.error,
      metadata: execution.metadata,
    }),
    progress: Math.round(
      (execution.steps.filter(s => s.status === 'completed').length /
        Math.max(execution.steps.length, 1)) * 100
    ),
  };

  if (existingTask) {
    await db.agentTask.update({
      where: { id: existingTask.id },
      data,
    });
  } else {
    await db.agentTask.create({ data });
  }
}

/**
 * Get all workflow executions.
 */
export async function getWorkflowExecutions(campaignId?: string): Promise<WorkflowExecution[]> {
  const tasks = await db.agentTask.findMany({
    where: {
      taskType: 'workflow',
      ...(campaignId ? { campaignId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return tasks.map(task => {
    const data = JSON.parse(task.output || '{}');
    return {
      id: task.input?.replace('workflow:', '') || task.id,
      workflowName: data.workflowName || 'Unknown',
      status: (task.status as WorkflowStatus) || 'pending',
      campaignId: task.campaignId || data.campaignId,
      steps: data.steps || [],
      currentStepIndex: data.currentStepIndex || 0,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      error: data.error,
      metadata: data.metadata || {},
    };
  });
}

/**
 * Get a specific workflow execution.
 */
export async function getWorkflowExecution(executionId: string): Promise<WorkflowExecution | null> {
  const task = await db.agentTask.findFirst({
    where: {
      taskType: 'workflow',
      input: `workflow:${executionId}`,
    },
  });

  if (!task) return null;

  const data = JSON.parse(task.output || '{}');
  return {
    id: executionId,
    workflowName: data.workflowName || 'Unknown',
    status: (task.status as WorkflowStatus) || 'pending',
    campaignId: task.campaignId || data.campaignId,
    steps: data.steps || [],
    currentStepIndex: data.currentStepIndex || 0,
    startedAt: data.startedAt,
    completedAt: data.completedAt,
    error: data.error,
    metadata: data.metadata || {},
  };
}
