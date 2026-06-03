/**
 * Research Stage: People Search
 * 
 * Finds key contacts and decision makers using Exa people search and LinkedIn.
 * This is Stage 3 of the deep research pipeline.
 * 
 * The actual implementation lives in research-engine.ts (executePeopleSearch).
 * This module exports types and constants for the people search stage.
 */

export interface PeopleSearchConfig {
  companyName: string;
  industry?: string;
  location?: string;
  maxResults?: number;
  searchLinkedIn?: boolean;
  searchTitles?: string[];
}

export const PEOPLE_SEARCH_DEFAULTS: PeopleSearchConfig = {
  companyName: '',
  maxResults: 8,
  searchLinkedIn: true,
  searchTitles: ['CEO', 'Founder', 'Director', 'VP', 'Head', 'CTO', 'CFO', 'COO'],
};
