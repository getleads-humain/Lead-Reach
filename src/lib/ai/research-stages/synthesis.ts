/**
 * Research Stage: Synthesis
 * 
 * LLM-powered synthesis that combines all gathered research data into
 * a structured, industry-grade research report.
 * This is the final stage (Stage 6) of the deep research pipeline.
 * 
 * The actual implementation lives in research-engine.ts (executeSynthesis).
 */

export interface SynthesisConfig {
  includeExecutiveSummary?: boolean;
  includeCompetitiveLandscape?: boolean;
  includeOutreachStrategy?: boolean;
  includeLeadScore?: boolean;
  maxTokens?: number;
}

export const SYNTHESIS_DEFAULTS: SynthesisConfig = {
  includeExecutiveSummary: true,
  includeCompetitiveLandscape: true,
  includeOutreachStrategy: true,
  includeLeadScore: true,
  maxTokens: 4000,
};
