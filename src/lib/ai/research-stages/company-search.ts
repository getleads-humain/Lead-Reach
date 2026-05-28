/**
 * Research Stage: Company Search
 * 
 * Deep searches for company data using Exa SDK, web search, and LinkedIn.
 * This is Stage 2 of the deep research pipeline.
 * 
 * The actual implementation lives in research-engine.ts (executeCompanySearch).
 * This module exports types and constants for the company search stage.
 */

export interface CompanySearchConfig {
  companyName: string;
  websiteUrl?: string;
  industry?: string;
  location?: string;
  maxResults?: number;
  useStructuredOutput?: boolean;
}

export const COMPANY_SEARCH_DEFAULTS: CompanySearchConfig = {
  companyName: '',
  maxResults: 5,
  useStructuredOutput: true,
};
