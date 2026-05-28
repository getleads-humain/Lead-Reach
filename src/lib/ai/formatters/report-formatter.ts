/**
 * Report Formatter
 * 
 * Formats the research report into various output formats.
 * The primary formatter (markdown) is in research-engine.ts (formatResearchReport).
 * This module provides additional formatting utilities.
 */

import type { ResearchReport, PeopleSearchOutput } from '../research-engine';

/**
 * Format a single contact as a one-line string.
 */
export function formatContact(contact: PeopleSearchOutput): string {
  const parts: string[] = [contact.name];
  if (contact.title) parts.push(`(${contact.title})`);
  if (contact.company) parts.push(`at ${contact.company}`);
  if (contact.linkedinUrl) parts.push(`[LinkedIn](${contact.linkedinUrl})`);
  return parts.join(' ');
}

/**
 * Generate a short summary line for the report.
 */
export function generateReportSummary(report: ResearchReport): string {
  const parts: string[] = [];
  parts.push(report.companyName);
  if (report.industry) parts.push(`(${report.industry})`);
  parts.push(`— Lead Score: ${report.leadScore}/100 (${report.leadTier.toUpperCase()})`);
  if (report.keyContacts.length > 0) {
    parts.push(`— ${report.keyContacts.length} contacts found`);
  }
  return parts.join(' ');
}

/**
 * Format the report as a plain text summary (no markdown).
 */
export function formatReportAsPlainText(report: ResearchReport): string {
  const lines: string[] = [];
  lines.push(`DEEP DIVE RESEARCH: ${report.companyName}`);
  lines.push(`Lead Score: ${report.leadScore}/100 (${report.leadTier.toUpperCase()})`);
  if (report.website) lines.push(`Website: ${report.website}`);
  if (report.industry) lines.push(`Industry: ${report.industry}`);
  if (report.location) lines.push(`Location: ${report.location}`);
  lines.push('');
  lines.push('EXECUTIVE SUMMARY:');
  lines.push(report.executiveSummary);
  lines.push('');
  if (report.keyContacts.length > 0) {
    lines.push('KEY CONTACTS:');
    for (const contact of report.keyContacts) {
      lines.push(`- ${formatContact(contact)}`);
    }
    lines.push('');
  }
  lines.push(`Research completed in ${(report.totalDurationMs / 1000).toFixed(1)}s`);
  lines.push(`Sources: ${report.sourcesUsed.join(', ')}`);
  return lines.join('\n');
}
