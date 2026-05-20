/**
 * Agent Capability Modules — Central Export
 * 
 * All agent modules are exported from this single entry point
 * for convenient importing across the application.
 */

// Agent Memory System
export {
  storeEpisode,
  storeInsight,
  storeProcedure,
  getAgentContext,
  queryMemory,
  clearAgentMemory,
  type Episode,
  type Insight,
  type Procedure,
  type MemoryEntry,
} from './agent-memory';

// Lead Scoring
export {
  scoreBANT,
  scoreMEDDIC,
  scoreProspect,
  calculateOpportunityQualityScore,
  type BANTInput,
  type BANTScore,
  type MEDDICInput,
  type MEDDICScore,
  type ProspectScoreInput,
  type ProspectScore,
} from './lead-scorer';

// Outreach Engine
export {
  generateOutreachSequence,
  saveOutreachSequence,
  type OutreachFramework,
  type OutreachSequenceType,
  type OutreachStep,
  type OutreachSequence,
  type OutreachInput,
} from './outreach-engine';

// Objection Handler
export {
  handleObjection,
  type ObjectionCategory,
  type ResponseFramework,
  type ObjectionContext,
  type ObjectionResponse,
} from './objection-handler';

// ICP Builder
export {
  buildICP,
  scoreLeadAgainstICP,
  type ICP,
  type ICPScoreResult,
  type ICPCriteria,
  type ICPDimensionScore,
} from './icp-builder';

// Competitive Intelligence
export {
  analyzeCompetitiveLandscape,
  generateBattleCard,
  type CompetitiveLandscape,
  type CompetitorInfo,
  type BattleCard,
} from './competitive-intel';

// Meeting Preparation
export {
  generateMeetingPrep,
  type MeetingPrepInput,
  type MeetingPrep,
} from './meeting-prep';

// Report Engine
export {
  generatePipelineReport,
  generateScoreDistribution,
  generateCampaignPerformance,
  generateAIInsights,
  generateActionItems,
  type PipelineReport,
  type ScoreDistribution,
  type CampaignPerformance,
  type AIInsight,
  type ActionItem,
} from './report-engine';
