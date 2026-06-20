'use client';

import React, { useMemo, useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

// ============================================================
// Lightweight Markdown → HTML Converter
// ============================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Allowed URL schemes for markdown links and images. Blocks
 * `javascript:`, `data:`, `vbscript:`, and other dangerous schemes
 * that could execute scripts when rendered in an href/src attribute.
 */
const ALLOWED_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Validate a URL for safe use in href/src attributes. Returns the
 * re-serialized URL string if safe, or `null` if the URL is unsafe
 * (dangerous scheme, malformed, etc.).
 *
 * This blocks XSS vectors like `[click](javascript:alert(1))` and
 * `[img](data:text/html,<script>...)`.
 */
function safeUrlOrNull(rawUrl: string): string | null {
  if (typeof rawUrl !== 'string' || rawUrl.length === 0) return null;
  // Strip leading/trailing whitespace and quotes that some markdown
  // authors use to wrap URLs.
  const trimmed = rawUrl.trim().replace(/^["']|["']$/g, '');
  // Relative URLs (starting with /, #, or ./) are safe.
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('./')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_URL_SCHEMES.has(parsed.protocol.toLowerCase())) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function processInlineMarkdown(text: string): string {
  // SECURITY: escape HTML first to prevent DOM text from being
  // reinterpreted as HTML (CodeQL alert "DOM text reinterpreted as
  // HTML"). All markdown transformations below operate on the
  // escaped text, and any user-controlled URLs are scheme-validated
  // before being inserted into href/src attributes.
  let result = escapeHtml(text);

  // Inline code (must be processed first to avoid conflicts)
  result = result.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Images ![alt](url) — validate URL scheme before insertion
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, rawUrl) => {
    const safeUrl = safeUrlOrNull(rawUrl);
    if (!safeUrl) return ''; // drop unsafe images
    return `<img src="${safeUrl}" alt="${alt}" class="max-w-full rounded-md my-1" />`;
  });

  // Links [text](url) — validate URL scheme before insertion
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, rawUrl) => {
    const safeUrl = safeUrlOrNull(rawUrl);
    if (!safeUrl) return linkText; // render text only, drop unsafe link
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-400/30 hover:decoration-emerald-300 transition-colors">${linkText}</a>`;
  });

  // Bold
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground/95">$1</strong>');

  // Italic
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Strikethrough
  result = result.replace(/~~(.+?)~~/g, '<del class="text-muted-foreground/60">$1</del>');

  return result;
}

function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  const output: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockContent: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];
  let tableHeaders: string[] = [];
  let isHeaderRow = true;
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  function closeList() {
    if (inList) {
      output.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
    }
  }

  function closeBlockquote() {
    if (inBlockquote) {
      output.push('</blockquote>');
      inBlockquote = false;
      blockquoteLines = [];
    }
  }

  function closeTable() {
    if (inTable) {
      let tableHtml = '<div class="overflow-x-auto my-3"><table class="w-full border-collapse text-sm">';
      if (tableHeaders.length > 0) {
        tableHtml += '<thead><tr>';
        tableHeaders.forEach(h => {
          tableHtml += `<th class="border border-border/30 px-3 py-1.5 text-left text-xs font-semibold text-foreground/80 bg-secondary/20">${processInlineMarkdown(h)}</th>`;
        });
        tableHtml += '</tr></thead>';
      }
      if (tableRows.length > 0) {
        tableHtml += '<tbody>';
        tableRows.forEach(row => {
          tableHtml += '<tr>';
          row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).forEach(cell => {
            tableHtml += `<td class="border border-border/20 px-3 py-1.5 text-foreground/70">${processInlineMarkdown(cell.trim())}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody>';
      }
      tableHtml += '</table></div>';
      output.push(tableHtml);
      inTable = false;
      tableRows = [];
      tableHeaders = [];
      isHeaderRow = true;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ---- Code block handling ----
    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        const lang = codeBlockLang.trim();
        const langLabel = lang ? `<div class="flex items-center justify-between px-3 py-1 border-b border-border/20 bg-secondary/10 rounded-t-lg"><span class="text-[10px] font-mono text-muted-foreground/60">${escapeHtml(lang)}</span></div>` : '';
        const codeContent = escapeHtml(codeBlockContent.join('\n'));
        output.push(
          `<div class="code-block my-3 rounded-lg border border-border/25 bg-[#0d1117] overflow-hidden">${langLabel}<pre class="p-3 overflow-x-auto text-[13px] leading-relaxed"><code class="text-emerald-300/90 font-mono">${codeContent}</code></pre></div>`
        );
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLang = '';
      } else {
        // Close any open elements
        closeList();
        closeBlockquote();
        closeTable();
        // Open code block
        inCodeBlock = true;
        codeBlockLang = line.trimStart().slice(3).trim();
        codeBlockContent = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // ---- Table handling ----
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        closeList();
        closeBlockquote();
        inTable = true;
        isHeaderRow = true;
      }

      const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

      if (isHeaderRow) {
        // Check if next line is separator
        const nextLine = lines[i + 1] || '';
        if (nextLine.match(/^\|[\s\-:|]+\|$/)) {
          tableHeaders = cells.map(c => c.trim());
          i++; // Skip separator line
          isHeaderRow = false;
          continue;
        } else {
          tableHeaders = [];
          isHeaderRow = false;
        }
      }

      // Skip separator rows
      if (line.match(/^\|[\s\-:|]+\|$/)) continue;

      tableRows.push(line);
      continue;
    } else if (inTable) {
      closeTable();
    }

    // ---- Blockquote handling ----
    if (line.startsWith('> ')) {
      if (!inBlockquote) {
        closeList();
        inBlockquote = true;
      }
      blockquoteLines.push(line.slice(2));
      continue;
    } else if (inBlockquote) {
      closeBlockquote();
    }

    // ---- Heading handling ----
    if (line.startsWith('#### ')) {
      closeList();
      output.push(`<h4 class="text-sm font-bold text-foreground/90 mt-4 mb-1.5">${processInlineMarkdown(line.slice(5))}</h4>`);
      continue;
    }
    if (line.startsWith('### ')) {
      closeList();
      output.push(`<h3 class="text-sm font-bold text-foreground/90 mt-4 mb-1.5">${processInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      closeList();
      output.push(`<h2 class="text-base font-bold text-foreground/90 mt-5 mb-2 border-b border-border/20 pb-1.5">${processInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      closeList();
      output.push(`<h1 class="text-lg font-bold text-foreground/95 mt-5 mb-2 border-b border-emerald-500/20 pb-2">${processInlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }

    // ---- Horizontal rule ----
    if (line.match(/^---+$/) || line.match(/^\*\*\*+$/) || line.match(/^___+$/)) {
      closeList();
      output.push('<hr class="border-border/20 my-4" />');
      continue;
    }

    // ---- Task list ----
    const taskMatch = line.match(/^[-*] \[([ xX])\] (.*)/);
    if (taskMatch) {
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        output.push('<ul class="space-y-1 my-2 ml-1">');
      }
      const checked = taskMatch[1] !== ' ';
      const checkboxClass = checked
        ? 'text-emerald-400'
        : 'text-muted-foreground/40';
      const checkIcon = checked ? '☑' : '☐';
      output.push(
        `<li class="flex items-start gap-2"><span class="${checkboxClass} shrink-0 text-sm leading-relaxed">${checkIcon}</span><span class="leading-relaxed ${checked ? 'text-foreground/80' : 'text-foreground/60'}">${processInlineMarkdown(taskMatch[2])}</span></li>`
      );
      continue;
    }

    // ---- Bullet list ----
    const bulletMatch = line.match(/^(\s*)[-*+•] (.*)/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        output.push('<ul class="space-y-1 my-2 ml-1">');
      }
      const indentClass = indent >= 4 ? 'ml-4' : indent >= 2 ? 'ml-2' : '';
      output.push(
        `<li class="flex items-start gap-2 ${indentClass}"><span class="text-emerald-400 shrink-0 mt-1.5 text-[8px]">●</span><span class="leading-relaxed">${processInlineMarkdown(bulletMatch[2])}</span></li>`
      );
      continue;
    }

    // ---- Numbered list ----
    const numMatch = line.match(/^(\s*)(\d+)\. (.*)/);
    if (numMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        output.push('<ol class="space-y-1 my-2 ml-1 list-decimal list-inside">');
      }
      output.push(
        `<li class="leading-relaxed pl-1"><span class="text-emerald-400 font-medium mr-1">${numMatch[2]}.</span>${processInlineMarkdown(numMatch[3])}</li>`
      );
      continue;
    }

    // Close list if we get here and were in one
    if (inList) closeList();

    // ---- Empty line ----
    if (line.trim() === '') {
      output.push('<div class="h-2"></div>');
      continue;
    }

    // ---- Regular paragraph ----
    output.push(`<p class="leading-relaxed my-1">${processInlineMarkdown(line)}</p>`);
  }

  // Close any remaining open elements
  if (inCodeBlock) {
    const codeContent = escapeHtml(codeBlockContent.join('\n'));
    output.push(
      `<div class="code-block my-3 rounded-lg border border-border/25 bg-[#0d1117] overflow-hidden"><pre class="p-3 overflow-x-auto text-[13px] leading-relaxed"><code class="text-emerald-300/90 font-mono">${codeContent}</code></pre></div>`
    );
  }
  closeList();
  closeBlockquote();
  closeTable();

  return output.join('');
}

// ============================================================
// Component
// ============================================================

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

export function MarkdownRenderer({ content, className, isStreaming }: MarkdownRendererProps) {
  // SSR safety: DOMPurify requires the browser `window` object, so on the
  // server we render an empty div and hydrate on the client. This avoids
  // "window is not defined" errors during Next.js SSR.
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const html = useMemo(() => {
    if (!isClient) return '';
    // Convert markdown to HTML, then sanitize with DOMPurify to strip
    // any XSS payloads (script tags, javascript: URLs, on* event handlers,
    // etc.) that may have survived the markdown→HTML conversion.
    //
    // This replaces the previous `dangerouslySetInnerHTML` without
    // sanitization, which CodeQL flagged as "DOM text reinterpreted as
    // HTML". DOMPurify is the industry-standard sanitizer recommended by
    // OWASP for this use case.
    const rawHtml = markdownToHtml(content);
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
        'a', 'img', 'strong', 'em', 'del', 'span', 'div',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'colspan', 'rowspan'],
      ALLOW_DATA_ATTR: false,
    });
  }, [content, isClient]);

  return (
    <div
      className={cn(
        'markdown-content text-sm text-foreground/85',
        isStreaming && 'streaming-cursor',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
