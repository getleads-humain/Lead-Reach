/**
 * LeadReach — Workforce System
 * ==============================
 * Public API for the AI workforce system (The Autonomous Enterprise).
 */

export { ALL_WORKFORCE_AGENTS, WORKFORCE_AGENT_MAP, type WorkforceAgentDefinition } from './definitions';
export { getWorkforceAgent, listWorkforceAgents, createWorkforceAgentFromDefinition, createWorkforceTask, startWorkforceTask, completeWorkforceTask, failWorkforceTask, createWorkforceSession, addMessageToSession, getWorkforceHealthOverview, recalculateAgentHealth, addWorkforceDocument, searchWorkforceDocuments, retrieveContextForAgent, seedWorkforceAgents, type WorkforceExecutionResult, type WorkforceHealthOverview } from './engine';
