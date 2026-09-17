'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Lightbulb,
  AlertCircle,
  ChevronRight,
  Terminal,
  Quote,
} from 'lucide-react';
import type { DocBlock, DocContent } from '@/lib/docs-content/types';

const CALLOUT_STYLES: Record<
  NonNullable<DocBlock['variant']>,
  { container: string; icon: React.ElementType; iconColor: string; label: string }
> = {
  info: {
    container: 'border-blue-500/30 bg-blue-500/5',
    icon: Info,
    iconColor: 'text-blue-400',
    label: 'Info',
  },
  warning: {
    container: 'border-amber-500/30 bg-amber-500/5',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    label: 'Warning',
  },
  success: {
    container: 'border-emerald-500/30 bg-emerald-500/5',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    label: 'Success',
  },
  tip: {
    container: 'border-violet-500/30 bg-violet-500/5',
    icon: Lightbulb,
    iconColor: 'text-violet-400',
    label: 'Tip',
  },
  danger: {
    container: 'border-red-500/30 bg-red-500/5',
    icon: AlertCircle,
    iconColor: 'text-red-400',
    label: 'Danger',
  },
};

// Very small, dependency-free syntax highlighter — just colors common shell
// keywords, JSON punctuation, and HTTP methods. Good enough for docs preview.
function highlightCode(code: string, language?: string): React.ReactNode {
  if (language === 'bash' || language === 'shell' || language === 'sh') {
    return code.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        return (
          <div key={i} className="text-muted-foreground/60">
            {line || '\u00A0'}
          </div>
        );
      }
      // Tokenize: curl, -X GET/POST, headers, URLs, strings
      const tokens = line.split(/(\s+)/);
      const colored = tokens.map((tok, j) => {
        if (/^(curl|export|echo|cat|cd|ls|mkdir|npm|npx|yarn|git|docker)$/.test(tok)) {
          return <span key={j} className="text-blue-400">{tok}</span>;
        }
        if (/^-(X|H|d|L|o|v|s)$/.test(tok) || /^--?[a-zA-Z-]+$/.test(tok)) {
          return <span key={j} className="text-amber-400">{tok}</span>;
        }
        if (/^(GET|POST|PATCH|PUT|DELETE)$/.test(tok)) {
          return <span key={j} className="text-violet-400 font-semibold">{tok}</span>;
        }
        if (/^https?:\/\//.test(tok) || /^'https?:\/\//.test(tok)) {
          return <span key={j} className="text-emerald-400">{tok}</span>;
        }
        if (/^['"].*['"]$/.test(tok)) {
          return <span key={j} className="text-yellow-400">{tok}</span>;
        }
        return <span key={j}>{tok}</span>;
      });
      return <div key={i}>{colored}</div>;
    });
  }
  if (language === 'json' || language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
    // Naive JSON highlight: keys (strings before colons), string values, numbers, booleans, null
    const parts: React.ReactNode[] = [];
    const regex = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(\b\d+(?:\.\d+)?\b)|(\b(?:true|false|null)\b)|([{}\[\],:])/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let k = 0;
    while ((match = regex.exec(code)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={k++}>{code.slice(lastIndex, match.index)}</span>);
      }
      if (match[1]) parts.push(<span key={k++} className="text-blue-400">{match[1]}</span>);
      else if (match[2]) parts.push(<span key={k++} className="text-emerald-400">{match[2]}</span>);
      else if (match[3]) parts.push(<span key={k++} className="text-amber-300">{match[3]}</span>);
      else if (match[4]) parts.push(<span key={k++} className="text-violet-400">{match[4]}</span>);
      else if (match[5]) parts.push(<span key={k++} className="text-muted-foreground/70">{match[5]}</span>);
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < code.length) {
      parts.push(<span key={k++}>{code.slice(lastIndex)}</span>);
    }
    return <pre className="whitespace-pre-wrap break-words">{parts}</pre>;
  }
  return <pre className="whitespace-pre-wrap break-words">{code}</pre>;
}

function DocBlockView({ block, accentColor }: { block: DocBlock; accentColor: string }) {
  switch (block.type) {
    case 'heading': {
      const level = block.level || 2;
      if (level === 2) {
        return (
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-8 mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full" style={{ backgroundColor: accentColor }} />
            {block.content}
          </h2>
        );
      }
      if (level === 3) {
        return <h3 className="text-base sm:text-lg font-semibold text-foreground mt-6 mb-2">{block.content}</h3>;
      }
      return <h4 className="text-sm font-semibold text-foreground/90 mt-4 mb-1.5 uppercase tracking-wide">{block.content}</h4>;
    }
    case 'subheading':
      return <h3 className="text-base font-semibold text-foreground mt-5 mb-2">{block.content}</h3>;
    case 'paragraph':
      return <p className="text-sm text-foreground/80 leading-relaxed mb-3">{block.content}</p>;
    case 'quote':
      return (
        <blockquote className="border-l-4 pl-4 my-4 italic text-sm text-foreground/70" style={{ borderColor: accentColor }}>
          <Quote className="h-3 w-3 inline mr-1 opacity-50" />
          {block.content}
        </blockquote>
      );
    case 'list':
      return (
        <ul className="space-y-1.5 my-3">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-1" style={{ color: accentColor }} />
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'steps':
      return (
        <ol className="space-y-3 my-4">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
              >
                {i + 1}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed pt-0.5">{item}</p>
            </li>
          ))}
        </ol>
      );
    case 'code':
      return (
        <div className="my-4">
          <div className="rounded-lg border border-border/30 bg-black/30 dark:bg-black/50 overflow-hidden">
            {block.language && (
              <div className="border-b border-border/20 px-3 py-1.5 flex items-center justify-between bg-card/40">
                <div className="flex items-center gap-1.5">
                  <Terminal className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">{block.language}</span>
                </div>
                {block.caption && <span className="text-[10px] text-muted-foreground">{block.caption}</span>}
              </div>
            )}
            <div className="p-3 text-[11px] sm:text-xs font-mono leading-relaxed overflow-x-auto">
              {highlightCode(block.code || '', block.language)}
            </div>
          </div>
          {block.caption && !block.language && (
            <p className="text-[10px] text-muted-foreground/60 mt-1 italic">{block.caption}</p>
          )}
        </div>
      );
    case 'callout': {
      const variant = block.variant || 'info';
      const style = CALLOUT_STYLES[variant];
      const Icon = style.icon;
      return (
        <div className={`rounded-lg border p-3 my-4 ${style.container}`}>
          <div className="flex items-start gap-2.5">
            <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${style.iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-semibold uppercase mb-1 ${style.iconColor}`}>{style.label}</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{block.content}</p>
            </div>
          </div>
        </div>
      );
    }
    case 'table':
      return (
        <div className="my-4">
          <div className="rounded-lg border border-border/30 overflow-hidden overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-card/60 border-b border-border/30">
                  {block.headers?.map((h, i) => (
                    <th key={i} className="text-left font-semibold text-foreground/90 px-3 py-2 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows?.map((row, i) => (
                  <tr key={i} className="border-b border-border/20 last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-foreground/80 align-top">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption && (
            <p className="text-[10px] text-muted-foreground/60 mt-1 italic">{block.caption}</p>
          )}
        </div>
      );
    case 'divider':
      return <hr className="border-border/30 my-6" />;
    default:
      return null;
  }
}

export function DocContentRenderer({
  doc,
  accentColor = '#10B981',
}: {
  doc: DocContent;
  accentColor?: string;
}) {
  return (
    <article className="space-y-1">
      {/* Title block */}
      <header className="mb-6 pb-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
            {doc.category}
          </Badge>
          {doc.readTime && (
            <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
              {doc.readTime}
            </Badge>
          )}
          {doc.lastUpdated && (
            <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
              Updated {doc.lastUpdated}
            </Badge>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{doc.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground/90 leading-relaxed">{doc.description}</p>
      </header>

      {/* Block stream */}
      <div className="space-y-1">
        {doc.blocks.map((block, i) => (
          <DocBlockView key={i} block={block} accentColor={accentColor} />
        ))}
      </div>
    </article>
  );
}
