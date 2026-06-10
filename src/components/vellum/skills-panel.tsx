'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Wrench,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  Zap,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useVellumStore, type Skill } from './vellum-provider';

// ============================================================
// Category Colors
// ============================================================

const CATEGORY_COLORS: Record<string, string> = {
  Research: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Discovery: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Strategy: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Communication: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Analysis: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Automation: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Data: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Analytics: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

// ============================================================
// Skill Card (Grid View)
// ============================================================

function SkillCard({ skill, onToggle, onExpand, isExpanded }: {
  skill: Skill;
  onToggle: () => void;
  onExpand: () => void;
  isExpanded: boolean;
}) {
  const categoryColor = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.Research;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-xl border p-3 transition-all cursor-pointer ${
        skill.isActive
          ? 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_20px_oklch(0.75_0.18_165/8%)]'
          : 'border-border/30 bg-secondary/5 hover:border-border/50'
      }`}
      onClick={onExpand}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-none">{skill.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground/80">{skill.name}</span>
            {skill.isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-2 w-2 rounded-full bg-emerald-400"
              />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5 line-clamp-2">{skill.description}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Badge variant="outline" className={`text-[7px] h-3.5 px-1 ${categoryColor}`}>
              {skill.category}
            </Badge>
            <span className="text-[8px] text-muted-foreground/30">{skill.tools.length} tools</span>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-3 mt-3 border-t border-border/15 space-y-2">
              {/* Activation hints */}
              <div>
                <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">Activation Hints</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {skill.activationHints.map((hint) => (
                    <Badge key={hint} variant="outline" className="text-[7px] h-3.5 px-1 border-border/20 text-muted-foreground/40">
                      {hint}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div>
                <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">Tools</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {skill.tools.map((tool) => (
                    <span key={tool} className="flex items-center gap-0.5 text-[8px] text-cyan-400/50">
                      <Wrench className="h-2 w-2" />{tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggle button */}
              <Button
                size="sm"
                className={`w-full h-7 text-[10px] font-semibold ${
                  skill.isActive
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                }`}
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
              >
                {skill.isActive ? (
                  <><Zap className="h-3 w-3 mr-1" />Deactivate</>
                ) : (
                  <><Sparkles className="h-3 w-3 mr-1" />Activate Skill</>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Skill Row (List View)
// ============================================================

function SkillRow({ skill, onToggle }: { skill: Skill; onToggle: () => void }) {
  return (
    <div className={`flex items-center gap-3 px-2.5 py-2 rounded-md transition-colors ${
      skill.isActive ? 'bg-emerald-500/5' : 'hover:bg-secondary/10'
    }`}>
      <span className="text-base">{skill.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-foreground/80">{skill.name}</span>
          {skill.isActive && <Check className="h-3 w-3 text-emerald-400" />}
        </div>
        <p className="text-[9px] text-muted-foreground/40 truncate">{skill.description}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className={`h-6 w-6 p-0 ${skill.isActive ? 'text-emerald-400' : 'text-muted-foreground/30 hover:text-foreground/60'}`}
        onClick={onToggle}
      >
        {skill.isActive ? <Zap className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
      </Button>
    </div>
  );
}

// ============================================================
// Main Skills Panel
// ============================================================

interface SkillsPanelProps {
  className?: string;
}

export function SkillsPanel({ className = '' }: SkillsPanelProps) {
  const skills = useVellumStore((s) => s.skills);
  const toggleSkill = useVellumStore((s) => s.toggleSkill);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(skills.map((s) => s.category));
    return Array.from(cats);
  }, [skills]);

  const filteredSkills = skills.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = s.name.toLowerCase().includes(q);
      const matchesCategory = s.category.toLowerCase().includes(q);
      const matchesHints = s.activationHints.some((h) => h.toLowerCase().includes(q));
      if (!matchesName && !matchesCategory && !matchesHints) return false;
    }
    if (filterCategory && s.category !== filterCategory) return false;
    return true;
  });

  const activeCount = skills.filter((s) => s.isActive).length;

  return (
    <Card className={`flex flex-col border-border/30 bg-card/50 h-full ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-violet-500/10">
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground/90">Skills</h3>
            <p className="text-[10px] text-muted-foreground/50">{activeCount} active</p>
          </div>
          <Badge variant="outline" className="text-[8px] h-4 px-1 border-violet-500/20 text-violet-400 ml-auto">
            {skills.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/30" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills..."
              className="h-8 text-xs pl-8 bg-secondary/20 border-border/30 placeholder:text-muted-foreground/30"
            />
          </div>

          {/* View mode + Category filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border/20 rounded-md">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 rounded-r-none ${viewMode === 'grid' ? 'bg-secondary/30 text-foreground/70' : 'text-muted-foreground/30'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 rounded-l-none ${viewMode === 'list' ? 'bg-secondary/30 text-foreground/70' : 'text-muted-foreground/30'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`text-[8px] h-5 px-1.5 ${!filterCategory ? 'bg-violet-500/10 text-violet-400' : 'text-muted-foreground/40'}`}
                onClick={() => setFilterCategory(null)}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant="ghost"
                  size="sm"
                  className={`text-[8px] h-5 px-1.5 ${filterCategory === cat ? 'bg-violet-500/10 text-violet-400' : 'text-muted-foreground/40'}`}
                  onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Skills display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-2">
              {filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onToggle={() => toggleSkill(skill.id)}
                  onExpand={() => setExpandedSkill(expandedSkill === skill.id ? null : skill.id)}
                  isExpanded={expandedSkill === skill.id}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredSkills.map((skill) => (
                <SkillRow key={skill.id} skill={skill} onToggle={() => toggleSkill(skill.id)} />
              ))}
            </div>
          )}

          {filteredSkills.length === 0 && (
            <p className="text-[10px] text-muted-foreground/30 italic text-center py-4">
              No skills match your search
            </p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
