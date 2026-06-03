/**
 * Research Stage: Website Reader
 * 
 * Scrapes the target website using Jina Reader API.
 * This is Stage 1 of the deep research pipeline.
 * 
 * The actual implementation lives in research-engine.ts (executeWebsiteRead).
 * This module exports types and constants for the website reading stage.
 */

export interface WebsiteReadConfig {
  url: string;
  format?: 'markdown' | 'text';
  maxContentLength?: number;
  extractEmails?: boolean;
  extractPhones?: boolean;
}

export const WEBSITE_READ_DEFAULTS: Omit<WebsiteReadConfig, 'url'> = {
  format: 'markdown',
  maxContentLength: 30000,
  extractEmails: true,
  extractPhones: true,
};
