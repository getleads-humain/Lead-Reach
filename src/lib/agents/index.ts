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

// Data Accuracy Engine
export {
  validateEmail,
  validateEmailBatch,
  getEmailQualityScore,
  validatePhone,
  formatPhone,
  validatePhoneBatch,
  validateAddress,
  normalizeAddress,
  assessDataQuality,
  assessDataQualityBatch,
  getDataQualityDashboard,
  detectDuplicates,
  generateMergePlan,
  executeMerge,
  autoMergeLowRisk,
  detectDataDecay,
  detectDataDecayBatch,
  prioritizeRefresh,
  verifyLeadData,
  verifyField,
  scheduleVerification,
  processPendingVerifications,
  type DataIssueSeverity,
  type DataIssueType,
  type DataIssue,
  type DataQualityScore,
  type ValidationCheck,
  type ValidationResult,
  type DuplicatePair,
  type MergeConflict,
  type FieldResolution,
  type MergePlan,
  type StaleField,
  type DataDecayReport,
  type DataQualityDashboard,
  type AddressInput,
} from './data-accuracy';

// Sales Enablement
export {
  generatePlaybook,
  customizePlaybookForLead,
  getPlaybooks,
  savePlaybook,
  generateBattleCard,
  compareCompetitors,
  getBattleCards,
  saveBattleCard,
  generateProposal,
  customizeProposal,
  getProposals,
  saveProposal,
  recommendContent,
  getContentLibrary,
  trackContentUsage,
  getContentPerformance,
  generateTrainingModule,
  getTrainingModules,
  trackTrainingProgress,
  type SalesPlaybook,
  type PlaybookStage,
  type BattleCard,
  type SalesProposal,
  type ProposalPricingOption,
  type SalesCollateral,
  type SalesCollateralType,
  type SalesTraining,
  type SalesTrainingQuiz,
} from './sales-enablement';

// Revenue Intelligence
export {
  generateRevenueForecast,
  updateForecastWithPipelineData,
  getForecasts,
  calculateDealVelocity,
  identifyBottlenecks,
  getStageConversionRates,
  calculatePipelineValue,
  estimateDealSize,
  getPipelineMetrics,
  calculateRevenueAttribution,
  getSourceROI,
  getChannelPerformance,
  calculateMRR,
  projectMRR,
  calculateChurnMetrics,
  getRevenueDashboard,
  scoreDealProbability,
  getPipelineRiskAssessment,
  type RevenueForecast,
  type DealVelocity,
  type PipelineMetrics,
  type RevenueAttribution,
  type MRRTracking,
  type DealProbability,
  type PipelineRiskAssessment,
} from './revenue-intelligence';

// ABM Engine
export {
  createAccountList,
  populateAccountList,
  tierAccounts,
  getAccountLists,
  getAccountsInList,
  scoreAccount,
  prioritizeAccounts,
  identifyBuyingCommittee,
  detectIntentSignals,
  aggregateIntentScore,
  getAccountsWithHighIntent,
  monitorAccountChanges,
  trackEngagement,
  calculateAccountEngagement,
  getEngagementTimeline,
  identifyEngagementTrends,
  generateContentStrategy,
  generatePersonalizedMessage,
  recommendNextAction,
  getABMCampaignPerformance,
  getAccountLevelROI,
  getTargetAccountProgress,
  createABMCampaign,
  type Contact,
  type AccountTier,
  type TargetAccount,
  type AccountListCriteria,
  type AccountList,
  type ABMCampaign,
  type IntentSignalType,
  type IntentSignal,
  type EngagementTrend,
  type AccountEngagement,
  type ABMContentStrategy,
  type AccountScoreResult,
  type BuyingCommitteeMember,
  type EngagementEvent,
  type ABMCampaignPerformance,
  type AccountLevelROI,
  type TargetAccountProgress,
} from './abm-engine';

// Email Engagement Engine
export {
  generateEmailTemplate,
  personalizeTemplate,
  getEmailTemplates,
  saveEmailTemplate,
  sendEmail,
  sendSequenceStep,
  scheduleSequence,
  recordTrackingEvent,
  getTrackingEvents,
  processWebhook,
  generateTrackingPixel,
  generateTrackingLinks,
  calculateEngagementScore,
  getEmailAnalytics,
  getBestPerformingTemplates,
  getSequencePerformance,
  createSequence,
  enrollLeadInSequence,
  advanceSequence,
  pauseSequence,
  getSequencesForLead,
  processBounce,
  processComplaint,
  getSuppressionList,
  isSuppressed,
  removeFromSuppressionList,
  processDueSequenceSteps,
  initializeSuppressionList,
  type EmailTemplateCategory,
  type EmailTemplate,
  type EmailSequenceStep,
  type EmailStepCondition,
  type EmailSequence,
  type EmailEventType,
  type EmailTrackingEvent,
  type EmailEngagementScore,
  type SendEmailParams,
  type SendEmailResult,
  type EmailAnalytics,
  type SequencePerformance,
  type SuppressedEmail,
  type LeadSequenceEnrollment,
} from './email-engine';

// Lead Intelligence
export {
  analyzeLeadBehavior,
  predictLeadConversion,
  getLeadIntelligenceDashboard,
  identifyDecisionMakers,
  mapBuyingSignals,
  scoreLeadEngagement,
  type LeadBehaviorProfile,
  type ConversionPrediction,
  type DecisionMaker,
  type BuyingSignal,
  type LeadEngagementScore,
} from './lead-intelligence';

// Agent Infrastructure (sessions, models, logs, cron, skills, plugins, profiles, config, keys, docs)
export {
  AgentRegistry,
  sessions,
  models,
  logs,
  cron,
  skills,
  plugins,
  profiles,
  config as agentConfig,
  keys,
  documentation,
  type AgentContext,
} from '@/lib/agent-infrastructure';
