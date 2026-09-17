/**
 * Documentation content schema for /docs page.
 *
 * Each clickable item in the docs cards maps to a `DocContent` object
 * containing rich blocks (paragraphs, headings, code, tables, callouts,
 * steps, lists). The DocContentRenderer component renders these blocks
 * in a print-ready, industry-grade format inside a slide-over panel.
 */

export type DocCategory = 'Getting Started' | 'AI Agents' | 'API Reference' | 'Integrations';

export interface DocItemRef {
  label: string;
  href: string; // anchor, e.g. "#creating-account"
}

export interface DocSectionCard {
  title: string;
  description: string;
  icon: string; // lucide icon name as string
  category: DocCategory;
  items: DocItemRef[];
}

export type DocBlockType =
  | 'paragraph'
  | 'heading'
  | 'subheading'
  | 'code'
  | 'callout'
  | 'list'
  | 'steps'
  | 'table'
  | 'divider'
  | 'quote';

export interface DocBlock {
  type: DocBlockType;
  // paragraph / heading / subheading / quote
  content?: string;
  // heading level (2 = h2, 3 = h3) — only used for heading/subheading
  level?: number;
  // code
  language?: string;
  code?: string;
  // callout
  variant?: 'info' | 'warning' | 'success' | 'tip' | 'danger';
  // list (unordered) and steps (ordered)
  items?: string[];
  // table
  headers?: string[];
  rows?: string[][];
  // optional caption (for code / table)
  caption?: string;
}

export interface DocContent {
  slug: string; // matches the href anchor without the #
  title: string;
  description: string;
  category: DocCategory;
  readTime?: string;
  lastUpdated?: string;
  blocks: DocBlock[];
}
