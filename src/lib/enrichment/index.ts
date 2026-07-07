/**
 * Enrichment Module — LeadReach
 * ==================================================
 *
 * Inspired by Relevance AI's multi-agent workforce architecture.
 * Provides a unified API for all lead enrichment capabilities.
 *
 * Architecture:
 *   orchestrator.ts  → Coordinates all 9 capabilities as a pipeline
 *   cache.ts         → LLM result caching (inspired by llmcache.com)
 *   company-intel.ts → Deep company intelligence (inspired by AI Agents)
 *
 * Usage:
 *   import { runFullPipeline, processBANT } from '@/lib/enrichment';
 */

export {
  runFullPipeline,
  processBANT,
  processWebEnrich,
  processAIScoring,
  processNextAction,
  processConversionPrediction,
  processDealSize,
  processBehavioralProfile,
  processAlerts,
  processCompanyResearch,
  type EnrichmentCapability,
  type EnrichmentStepResult,
  type EnrichmentOrchestrationResult,
} from './orchestrator';

export {
  cacheCapabilityResult,
  getCapabilityResult,
  isCapabilityCached,
  invalidateLeadCache,
  getCacheStats,
} from './cache';

export {
  generateCompanyIntelligence,
  inferIndustryFromName,
  INDUSTRY_TECH_STACKS,
  INDUSTRY_DEAL_SIZES,
  INDUSTRY_SALES_CYCLES,
  type CompanyIntelligence,
} from './company-intel';

export {
  findSimilarLeads,
  buildICPFromTopLeads,
  batchEnrichLeads,
  type SimilarLeadResult,
  type LookalikeProfile,
} from './vector-search';
