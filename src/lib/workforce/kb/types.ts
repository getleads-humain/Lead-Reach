/**
 * Knowledge Base — Shared Types
 * ==============================
 * Defines the canonical shape of a knowledge document's content payload.
 * Each agent's KB module exports an array of these; the seeder creates
 * WorkforceDocument rows from them.
 *
 * Category values match the categories the UI offers:
 *   sop, runbook, playbook, reference, training
 * (Stored as the capitalized display form for consistency with existing data.)
 */

export interface KnowledgeDocContent {
  /** Document title (must be unique per agent) */
  title: string;

  /** One of: SOP, Runbook, Playbook, Reference, Training */
  category: 'SOP' | 'Runbook' | 'Playbook' | 'Reference' | 'Training';

  /** Tags for search/filter (lowercase, kebab-case preferred) */
  tags: string[];

  /**
   * Full markdown content of the document.
   * Should be substantive (typically 600-1500 words).
   * Rendered as-is in the workspace UI.
   */
  content: string;
}
