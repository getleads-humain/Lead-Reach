/**
 * Research Stage: News & Social
 * 
 * Gathers recent news, press releases, and social activity about the company.
 * This is Stage 4 of the deep research pipeline.
 * 
 * The actual implementation lives in research-engine.ts (executeNewsAndSocial).
 */

export interface NewsSocialConfig {
  companyName: string;
  maxResults?: number;
  includeNews?: boolean;
  includeBlogs?: boolean;
  includePress?: boolean;
  dateRange?: string; // e.g., "2024-01-01:"
}

export const NEWS_SOCIAL_DEFAULTS: NewsSocialConfig = {
  companyName: '',
  maxResults: 5,
  includeNews: true,
  includeBlogs: true,
  includePress: true,
};
