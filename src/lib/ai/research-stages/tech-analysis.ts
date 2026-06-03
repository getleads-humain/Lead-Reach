/**
 * Research Stage: Technology Analysis
 * 
 * Analyzes the company's technology stack, hosting, and digital infrastructure.
 * This is Stage 5 of the deep research pipeline.
 * 
 * The actual implementation lives in research-engine.ts (executeTechAnalysis).
 */

export interface TechAnalysisConfig {
  websiteUrl?: string;
  companyName: string;
  deepScan?: boolean;
  detectAnalytics?: boolean;
  detectHosting?: boolean;
}

export const TECH_ANALYSIS_DEFAULTS: TechAnalysisConfig = {
  companyName: '',
  deepScan: false,
  detectAnalytics: true,
  detectHosting: true,
};
