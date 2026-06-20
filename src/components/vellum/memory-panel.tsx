'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Search,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Database,
  Target,
  Lightbulb,
  Users,
  Link2,
  BarChart3,
  Sparkles,
  Filter,
  MemoryStick,
} from 'lucide-react';
import { useVellumStore, type MemoryNode } from './vellum-provider';

// ============================================================
// Memory Type Configuration
// ============================================================

const MEMORY_TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  fact: { color: 'text-cyan-400', bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', icon: Database, label: 'Fact' },
  preference: { color: 'text-violet-400', bg: 'bg-violet-500/5', border: 'border-violet-500/20', icon: Target, label: 'Preference' },
  relationship: { color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: Users, label: 'Relationship' },
  insight: { color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', icon: Lightbulb, label: 'Insight' },
  procedure: { color: 'text-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/20', icon: Sparkles, label: 'Procedure' },
};

// ============================================================
// Memory Stats
// ============================================================

function MemoryStats({ memories }: { memories: MemoryNode[] }) {
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    let totalConfidence = 0;
    memories.forEach((m) => {
      byType[m.type] = (byType[m.type] || 0) + 1;
      totalConfidence += m.confidence;
    });
    const avgConfidence = memories.length > 0 ? totalConfidence / memories.length : 0;
    return { byType, avgConfidence, total: memories.length };
  }, [memories]);

  return (
    <div className="rounded-lg border border-border/20 bg-secondary/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Memory Stats</span>
        <Badge variant="outline" className="text-[8px] h-4 px-1 border-emerald-500/20 text-emerald-400">
          {stats.total} nodes
        </Badge>
      </div>

      {/* Total + Avg confidence */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-background/50 border border-border/15 p-2">
          <span className="text-[9px] text-muted-foreground/50">Total Memories</span>
          <p className="text-lg font-bold text-foreground/80">{stats.total}</p>
        </div>
        <div className="rounded-md bg-background/50 border border-border/15 p-2">
          <span className="text-[9px] text-muted-foreground/50">Avg Confidence</span>
          <p className="text-lg font-bold text-emerald-400">{(stats.avgConfidence * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* By type */}
      <div className="space-y-1.5">
        {Object.entries(stats.byType).map(([type, count]) => {
          const config = MEMORY_TYPE_CONFIG[type];
          if (!config) return null;
          return (
            <div key={type} className="flex items-center gap-2">
              <config.icon className={`h-3 w-3 ${config.color}`} />
              <span className="text-[9px] text-muted-foreground/60 w-20">{config.label}</span>
              <div className="flex-1 h-1 bg-secondary/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${config.color.replace('text-', 'bg-')}`}
                  style={{ width: `${(count / stats.total) * 100}%`, opacity: 0.6 }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground/40 w-6 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Memory Graph Visualization (Simple)
// ============================================================

function MemoryGraph({ memories }: { memories: MemoryNode[] }) {
  // Simple radial visualization
  const nodes = memories.slice(0, 8);
  const centerX = 80;
  const centerY = 80;
  const radius = 55;

  return (
    <div className="rounded-lg border border-border/20 bg-secondary/5 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Brain className="h-3 w-3 text-emerald-400" />
        <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Knowledge Graph</span>
      </div>
      <svg viewBox="0 0 160 160" className="w-full max-w-[200px] mx-auto">
        {/* Center node */}
        <circle cx={centerX} cy={centerY} r={8} fill="oklch(0.75 0.18 165 / 30%)" stroke="oklch(0.75 0.18 165 / 50%)" strokeWidth="1.5" />
        <text x={centerX} y={centerY + 1} textAnchor="middle" fontSize="6" fill="oklch(0.90 0 0)">AI</text>

        {/* Memory nodes */}
        {nodes.map((node, i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          const config = MEMORY_TYPE_CONFIG[node.type];
          const nodeColor = config?.color || 'text-emerald-400';

          // Connection line
          return (
            <g key={node.id}>
              <line
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="oklch(0.3 0.01 270 / 30%)"
                strokeWidth="1"
              />
              {/* Cross connections */}
              {node.connections.map((connId) => {
                const connIndex = nodes.findIndex((n) => n.id === connId);
                if (connIndex < 0) return null;
                const connAngle = (connIndex / nodes.length) * Math.PI * 2 - Math.PI / 2;
                const cx = centerX + Math.cos(connAngle) * radius;
                const cy = centerY + Math.sin(connAngle) * radius;
                return (
                  <line
                    key={`${node.id}-${connId}`}
                    x1={x}
                    y1={y}
                    x2={cx}
                    y2={cy}
                    stroke="oklch(0.3 0.01 270 / 15%)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                );
              })}
              <circle
                cx={x}
                cy={y}
                r={5 + node.significance * 4}
                fill="oklch(0.5 0.15 180 / 20%)"
                stroke="oklch(0.5 0.15 180 / 40%)"
                strokeWidth="1"
              />
              <text x={x} y={y + 1} textAnchor="middle" fontSize="5" fill="oklch(0.7 0 0)">
                {node.type.slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// Single Memory Item
// ============================================================

function MemoryItem({ memory, onDelete }: { memory: MemoryNode; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const config = MEMORY_TYPE_CONFIG[memory.type] || MEMORY_TYPE_CONFIG.fact;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={`rounded-md border-l-2 ${config.border} ${config.bg} overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-2 p-2.5 hover:bg-secondary/10 transition-colors text-left"
      >
        <config.icon className={`h-3.5 w-3.5 ${config.color} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] text-foreground/70 leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
            {memory.content}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`text-[7px] h-3.5 px-1 ${config.color} border-current/20`}>
              {config.label}
            </Badge>
            <span className="text-[8px] text-muted-foreground/30">
              {(memory.confidence * 100).toFixed(0)}% conf
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground/30" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/30" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/10"
          >
            <div className="p-2.5 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">Confidence</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Progress value={memory.confidence * 100} className="h-1 flex-1 bg-secondary/20 [&>div]:bg-emerald-400" />
                    <span className="text-[9px] font-medium text-foreground/60">{(memory.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">Significance</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Progress value={memory.significance * 100} className="h-1 flex-1 bg-secondary/20 [&>div]:bg-amber-400" />
                    <span className="text-[9px] font-medium text-foreground/60">{(memory.significance * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">Source</span>
                <p className="text-[9px] text-muted-foreground/60">{memory.source}</p>
              </div>
              <div>
                <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">Created</span>
                <p className="text-[9px] text-muted-foreground/60">{new Date(memory.createdAt).toLocaleString()}</p>
              </div>
              {memory.connections.length > 0 && (
                <div>
                  <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">Connections</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {memory.connections.map((connId) => (
                      <Badge key={connId} variant="outline" className="text-[7px] h-3.5 px-1 border-border/20 text-muted-foreground/40">
                        <Link2 className="h-2 w-2 mr-0.5" />{connId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[9px] gap-1 text-red-400/50 hover:text-red-400 hover:bg-red-500/5"
                  onClick={(e) => { e.stopPropagation(); onDelete(memory.id); }}
                >
                  <Trash2 className="h-2.5 w-2.5" />Delete
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Add Memory Form
// ============================================================

function AddMemoryForm({ onAdd }: { onAdd: (memory: MemoryNode) => void }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<MemoryNode['type']>('fact');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAdd({
      id: `mem-${Date.now()}`,
      type,
      content: content.trim(),
      confidence: 0.7,
      significance: 0.5,
      source: 'manual',
      createdAt: Date.now(),
      connections: [],
    });
    setContent('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full text-[10px] h-7 gap-1.5 border-border/30 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-3 w-3" />Add Memory
      </Button>
    );
  }

  return (
    <motion.form
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      onSubmit={handleSubmit}
      className="rounded-lg border border-border/20 bg-secondary/5 p-3 space-y-2"
    >
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Memory content..."
        className="h-8 text-xs bg-secondary/20 border-border/30 placeholder:text-muted-foreground/30"
      />
      <div className="flex items-center gap-1.5">
        {(Object.entries(MEMORY_TYPE_CONFIG) as [string, { label: string; color: string }][]).map(([key, config]) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key as MemoryNode['type'])}
            className={`text-[8px] px-1.5 py-0.5 rounded border transition-colors ${
              type === key ? `${config.color} border-current/30 bg-current/5` : 'text-muted-foreground/40 border-border/20'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" className="h-7 text-[10px] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
          Add
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground/50" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </motion.form>
  );
}

// ============================================================
// Main Memory Panel
// ============================================================

interface MemoryPanelProps {
  className?: string;
}

export function MemoryPanel({ className = '' }: MemoryPanelProps) {
  const memories = useVellumStore((s) => s.memories);
  const addMemory = useVellumStore((s) => s.addMemory);
  const removeMemory = useVellumStore((s) => s.removeMemory);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(true);

  const filteredMemories = memories.filter((m) => {
    if (searchQuery && !m.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType && m.type !== filterType) return false;
    return true;
  });

  return (
    <Card className={`flex flex-col border-border/30 bg-card/50 h-full ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-amber-500/10">
            <MemoryStick className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground/90">Memory</h3>
            <p className="text-[10px] text-muted-foreground/50">Knowledge graph</p>
          </div>
          <Badge variant="outline" className="text-[8px] h-4 px-1 border-amber-500/20 text-amber-400 ml-auto">
            {memories.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Graph */}
          {showGraph && (
            <MemoryGraph memories={memories} />
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[9px] h-5 text-muted-foreground/30"
            onClick={() => setShowGraph(!showGraph)}
          >
            {showGraph ? 'Hide' : 'Show'} graph
          </Button>

          {/* Stats */}
          <MemoryStats memories={memories} />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/30" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="h-8 text-xs pl-8 bg-secondary/20 border-border/30 placeholder:text-muted-foreground/30"
            />
          </div>

          {/* Type filter */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`text-[8px] h-5 px-1.5 ${!filterType ? 'bg-violet-500/10 text-violet-400' : 'text-muted-foreground/40'}`}
              onClick={() => setFilterType(null)}
            >
              All
            </Button>
            {(Object.entries(MEMORY_TYPE_CONFIG) as [string, { label: string; color: string }][]).map(([key, config]) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                className={`text-[8px] h-5 px-1.5 ${filterType === key ? `${config.color} bg-current/10` : 'text-muted-foreground/40'}`}
                onClick={() => setFilterType(filterType === key ? null : key)}
              >
                {config.label}
              </Button>
            ))}
          </div>

          {/* Memory list */}
          <div className="space-y-1.5">
            {filteredMemories.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/30 italic text-center py-4">
                {memories.length === 0 ? 'No memories stored yet' : 'No matches found'}
              </p>
            ) : (
              <AnimatePresence>
                {filteredMemories.map((memory) => (
                  <MemoryItem key={memory.id} memory={memory} onDelete={removeMemory} />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Add memory */}
          <AddMemoryForm onAdd={addMemory} />
        </div>
      </ScrollArea>
    </Card>
  );
}
