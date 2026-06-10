/**
 * Proactivity Engine — Multi-Step Sequences
 * ===========================================
 * Adapted from the Vellum Assistant architecture for LeadReach AI.
 *
 * The sequence system manages multi-step outreach and engagement
 * campaigns. Each sequence consists of ordered steps with delays
 * between them. Leads/contacts are "enrolled" in a sequence and
 * automatically advanced through each step.
 *
 * Key features:
 *   - Create and manage multi-step sequences
 *   - Enroll leads/contacts into sequences
 *   - Automatically advance through steps on schedule
 *   - Pause/resume sequences and individual enrollments
 *   - Track completion and failure rates
 *
 * Integration points:
 *   - Uses `@/lib/db` for persistent storage
 *   - Uses `@/lib/llm` for step execution
 *   - Works with `@/lib/agent-infrastructure/logs` for audit trail
 *   - Coordinates with `scheduler.ts` for step timing
 */

import { callLLM } from '@/lib/llm';
import { db } from '@/lib/db';
import {
  type Sequence,
  type SequenceStep,
  type SequenceEnrollment,
  type SequenceStatus,
  type SequenceStepStatus,
} from './types';

// ── In-Memory Stores ────────────────────────────────────────────

const sequenceStore = new Map<string, Sequence>();
const enrollmentStore = new Map<string, SequenceEnrollment>();

// ── Sequence CRUD ───────────────────────────────────────────────

/**
 * Create a new sequence.
 * Validates that steps have proper ordering and delays.
 */
export function createSequence(sequence: Sequence): void {
  // Validate steps
  if (sequence.steps.length === 0) {
    throw new Error(`Sequence "${sequence.name}" must have at least one step`);
  }

  // Ensure all steps have proper IDs
  sequence.steps.forEach((step, index) => {
    if (!step.id) {
      step.id = `${sequence.id}-step-${index}`;
    }
    if (!step.status) {
      step.status = 'pending';
    }
  });

  sequenceStore.set(sequence.id, sequence);
  console.log(`[Sequences] Created: "${sequence.name}" (id=${sequence.id}, steps=${sequence.steps.length})`);
}

/**
 * Get a sequence by ID.
 */
export function getSequence(sequenceId: string): Sequence | undefined {
  return sequenceStore.get(sequenceId);
}

/**
 * List all sequences, optionally filtered by scope or status.
 */
export function listSequences(scopeId?: string, status?: SequenceStatus): Sequence[] {
  const results: Sequence[] = [];
  for (const seq of sequenceStore.values()) {
    if (scopeId && seq.scopeId !== scopeId) continue;
    if (status && seq.status !== status) continue;
    results.push(seq);
  }
  return results;
}

/**
 * Update a sequence's configuration.
 */
export function updateSequence(sequenceId: string, updates: Partial<Sequence>): void {
  const existing = sequenceStore.get(sequenceId);
  if (!existing) {
    console.warn(`[Sequences] Cannot update non-existent sequence id=${sequenceId}`);
    return;
  }

  const updated = { ...existing, ...updates };
  sequenceStore.set(sequenceId, updated);
  console.log(`[Sequences] Updated: "${updated.name}" (id=${sequenceId})`);
}

/**
 * Pause a sequence.
 * No new steps will be executed for enrollments in this sequence.
 */
export function pauseSequence(sequenceId: string): void {
  const sequence = sequenceStore.get(sequenceId);
  if (!sequence) {
    console.warn(`[Sequences] Cannot pause non-existent sequence id=${sequenceId}`);
    return;
  }

  sequence.status = 'paused';
  sequenceStore.set(sequenceId, sequence);

  // Also pause all active enrollments
  for (const [id, enrollment] of enrollmentStore) {
    if (enrollment.sequenceId === sequenceId && enrollment.status === 'active') {
      enrollment.status = 'paused';
      enrollmentStore.set(id, enrollment);
    }
  }

  console.log(`[Sequences] Paused: "${sequence.name}" (id=${sequenceId})`);
}

/**
 * Resume a paused sequence.
 */
export function resumeSequence(sequenceId: string): void {
  const sequence = sequenceStore.get(sequenceId);
  if (!sequence) {
    console.warn(`[Sequences] Cannot resume non-existent sequence id=${sequenceId}`);
    return;
  }

  sequence.status = 'active';
  sequenceStore.set(sequenceId, sequence);

  // Also resume paused enrollments
  for (const [id, enrollment] of enrollmentStore) {
    if (enrollment.sequenceId === sequenceId && enrollment.status === 'paused') {
      enrollment.status = 'active';
      enrollment.currentStepStartedAt = Date.now(); // Reset step timer
      enrollmentStore.set(id, enrollment);
    }
  }

  console.log(`[Sequences] Resumed: "${sequence.name}" (id=${sequenceId})`);
}

/**
 * Delete a sequence.
 * Also removes all associated enrollments.
 */
export function deleteSequence(sequenceId: string): void {
  // Remove enrollments
  for (const [id, enrollment] of enrollmentStore) {
    if (enrollment.sequenceId === sequenceId) {
      enrollmentStore.delete(id);
    }
  }

  sequenceStore.delete(sequenceId);
  console.log(`[Sequences] Deleted: id=${sequenceId}`);
}

// ── Enrollment Management ───────────────────────────────────────

/**
 * Enroll a scope (lead/contact) into a sequence.
 * The enrollment starts at step 0.
 */
export function enrollInSequence(sequenceId: string, scopeId: string): SequenceEnrollment {
  const sequence = sequenceStore.get(sequenceId);
  if (!sequence) {
    throw new Error(`Sequence not found: ${sequenceId}`);
  }

  if (sequence.status !== 'active') {
    throw new Error(`Sequence "${sequence.name}" is not active (status=${sequence.status})`);
  }

  // Check if already enrolled
  for (const enrollment of enrollmentStore.values()) {
    if (enrollment.sequenceId === sequenceId && enrollment.scopeId === scopeId && enrollment.status === 'active') {
      console.warn(`[Sequences] Scope "${scopeId}" is already enrolled in sequence "${sequence.name}"`);
      return enrollment;
    }
  }

  const enrollment: SequenceEnrollment = {
    id: `enr-${sequenceId}-${scopeId}-${Date.now()}`,
    sequenceId,
    scopeId,
    currentStepIndex: 0,
    enrolledAt: Date.now(),
    currentStepStartedAt: Date.now(),
    status: 'active',
  };

  enrollmentStore.set(enrollment.id, enrollment);
  sequence.enrolledCount++;

  // Log the enrollment
  logSequenceAction(`Enrolled "${scopeId}" in sequence "${sequence.name}"`, {
    sequenceId,
    scopeId,
    enrollmentId: enrollment.id,
  });

  console.log(`[Sequences] Enrolled scope="${scopeId}" in "${sequence.name}" (enrollmentId=${enrollment.id})`);

  return enrollment;
}

/**
 * Advance an enrollment to the next step.
 * Called when the current step's delay has elapsed and it's been executed.
 */
export async function advanceSequence(enrollmentId: string): Promise<void> {
  const enrollment = enrollmentStore.get(enrollmentId);
  if (!enrollment) {
    console.warn(`[Sequences] Cannot advance non-existent enrollment id=${enrollmentId}`);
    return;
  }

  const sequence = sequenceStore.get(enrollment.sequenceId);
  if (!sequence) {
    console.warn(`[Sequences] Sequence not found for enrollment id=${enrollmentId}`);
    enrollment.status = 'failed';
    enrollmentStore.set(enrollmentId, enrollment);
    return;
  }

  // Mark current step as completed
  const currentStep = sequence.steps[enrollment.currentStepIndex];
  if (currentStep) {
    currentStep.status = 'completed';
  }

  // Move to next step
  enrollment.currentStepIndex++;
  enrollment.currentStepStartedAt = Date.now();

  // Check if sequence is complete
  if (enrollment.currentStepIndex >= sequence.steps.length) {
    enrollment.status = 'completed';

    logSequenceAction(`Completed sequence "${sequence.name}" for scope "${enrollment.scopeId}"`, {
      sequenceId: sequence.id,
      scopeId: enrollment.scopeId,
      enrollmentId,
      totalSteps: sequence.steps.length,
    });

    console.log(`[Sequences] Completed sequence "${sequence.name}" for scope="${enrollment.scopeId}"`);
  } else {
    // Execute the next step
    const nextStep = sequence.steps[enrollment.currentStepIndex];
    nextStep.status = 'executing';

    logSequenceAction(`Advanced to step ${enrollment.currentStepIndex + 1}/${sequence.steps.length} in "${sequence.name}" for scope "${enrollment.scopeId}"`, {
      sequenceId: sequence.id,
      scopeId: enrollment.scopeId,
      stepIndex: enrollment.currentStepIndex,
    });

    console.log(`[Sequences] Advanced to step ${enrollment.currentStepIndex + 1}/${sequence.steps.length} for scope="${enrollment.scopeId}"`);
  }

  enrollmentStore.set(enrollmentId, enrollment);
}

/**
 * Pause an individual enrollment.
 */
export function pauseEnrollment(enrollmentId: string): void {
  const enrollment = enrollmentStore.get(enrollmentId);
  if (!enrollment) {
    console.warn(`[Sequences] Cannot pause non-existent enrollment id=${enrollmentId}`);
    return;
  }

  enrollment.status = 'paused';
  enrollmentStore.set(enrollmentId, enrollment);
  console.log(`[Sequences] Paused enrollment id=${enrollmentId}`);
}

/**
 * Resume an individual enrollment.
 */
export function resumeEnrollment(enrollmentId: string): void {
  const enrollment = enrollmentStore.get(enrollmentId);
  if (!enrollment) {
    console.warn(`[Sequences] Cannot resume non-existent enrollment id=${enrollmentId}`);
    return;
  }

  enrollment.status = 'active';
  enrollment.currentStepStartedAt = Date.now();
  enrollmentStore.set(enrollmentId, enrollment);
  console.log(`[Sequences] Resumed enrollment id=${enrollmentId}`);
}

/**
 * Get all enrollments for a sequence.
 */
export function getSequenceEnrollments(sequenceId: string): SequenceEnrollment[] {
  const results: SequenceEnrollment[] = [];
  for (const enrollment of enrollmentStore.values()) {
    if (enrollment.sequenceId === sequenceId) {
      results.push(enrollment);
    }
  }
  return results;
}

/**
 * Get an enrollment by ID.
 */
export function getEnrollment(enrollmentId: string): SequenceEnrollment | undefined {
  return enrollmentStore.get(enrollmentId);
}

// ── Step Execution ──────────────────────────────────────────────

/**
 * Execute a sequence step for an enrollment.
 * Uses the LLM to generate the step's output.
 *
 * Returns the generated content or null if execution failed.
 */
export async function executeSequenceStep(
  enrollmentId: string
): Promise<string | null> {
  const enrollment = enrollmentStore.get(enrollmentId);
  if (!enrollment || enrollment.status !== 'active') return null;

  const sequence = sequenceStore.get(enrollment.sequenceId);
  if (!sequence) return null;

  const step = sequence.steps[enrollment.currentStepIndex];
  if (!step) return null;

  try {
    step.status = 'executing';

    // Use LLM to execute the step's prompt
    const response = await callLLM({
      systemPrompt: `You are executing step ${enrollment.currentStepIndex + 1} of ${sequence.steps.length} in the "${sequence.name}" outreach sequence.

Scope (lead/contact): ${enrollment.scopeId}
Channel: ${step.channelId ?? 'email'}

Execute this step according to the prompt below. Generate appropriate outreach content.`,
      userMessage: step.prompt,
      temperature: 0.4,
      maxTokens: 2000,
      thinkingBudget: 'standard',
    });

    if (!response) {
      step.status = 'failed';
      console.warn(`[Sequences] Step execution failed (no LLM response) for enrollment=${enrollmentId}`);
      return null;
    }

    step.status = 'completed';

    // Log the execution
    logSequenceAction(`Executed step ${enrollment.currentStepIndex + 1} in "${sequence.name}"`, {
      sequenceId: sequence.id,
      enrollmentId,
      stepIndex: enrollment.currentStepIndex,
      stepId: step.id,
      responseLength: response.length,
    });

    return response;
  } catch (error) {
    step.status = 'failed';
    console.error(`[Sequences] Step execution error for enrollment=${enrollmentId}:`, error);
    return null;
  }
}

/**
 * Process all due sequence steps across all active enrollments.
 * Called by the scheduler on each tick.
 *
 * A step is due when:
 *   - The enrollment is active
 *   - The current step's delayMs has elapsed since currentStepStartedAt
 *   - The step is in 'pending' or 'executing' state
 */
export async function processDueSteps(): Promise<number> {
  const now = Date.now();
  let processed = 0;

  for (const [enrollmentId, enrollment] of enrollmentStore) {
    if (enrollment.status !== 'active') continue;

    const sequence = sequenceStore.get(enrollment.sequenceId);
    if (!sequence || sequence.status !== 'active') continue;

    const step = sequence.steps[enrollment.currentStepIndex];
    if (!step || step.status === 'completed') continue;

    // Check if the step delay has elapsed
    const elapsed = now - enrollment.currentStepStartedAt;
    if (elapsed < step.delayMs) continue;

    // Execute the step
    const result = await executeSequenceStep(enrollmentId);
    if (result) {
      // Advance to the next step
      await advanceSequence(enrollmentId);
      processed++;
    }
  }

  return processed;
}

// ── Sequence Statistics ─────────────────────────────────────────

/**
 * Get statistics for a sequence.
 */
export function getSequenceStats(sequenceId: string): {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  failedEnrollments: number;
  pausedEnrollments: number;
  averageStepCompletionMs: number;
} | null {
  const sequence = sequenceStore.get(sequenceId);
  if (!sequence) return null;

  const enrollments = getSequenceEnrollments(sequenceId);
  const completedSteps = sequence.steps.filter(s => s.status === 'completed');

  return {
    totalEnrollments: enrollments.length,
    activeEnrollments: enrollments.filter(e => e.status === 'active').length,
    completedEnrollments: enrollments.filter(e => e.status === 'completed').length,
    failedEnrollments: enrollments.filter(e => e.status === 'failed').length,
    pausedEnrollments: enrollments.filter(e => e.status === 'paused').length,
    averageStepCompletionMs: completedSteps.length > 0
      ? completedSteps.reduce((sum, s) => sum + (s.delayMs || 0), 0) / completedSteps.length
      : 0,
  };
}

// ── Helper: Logging ─────────────────────────────────────────────

/**
 * Log a sequence-related action to the agent log.
 */
async function logSequenceAction(message: string, metadata: Record<string, unknown>): Promise<void> {
  try {
    await db.agentLog.create({
      data: {
        agentName: 'pipeline-manager',
        level: 'info',
        category: 'execution',
        message,
        metadata: JSON.stringify(metadata),
      },
    });
  } catch {
    // Logging failure is non-critical
  }
}
