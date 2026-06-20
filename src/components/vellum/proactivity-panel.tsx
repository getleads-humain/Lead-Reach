'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  CalendarClock,
  Heart,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Play,
  Pause,
  Mail,
  MessageCircle,
  Timer,
  Zap,
  Activity,
  ListChecks,
} from 'lucide-react';
import { useVellumStore, type Schedule, type FollowUp, type OutreachSequence } from './vellum-provider';

// ============================================================
// Schedule Item
// ============================================================

function ScheduleItem({ schedule, onToggle }: { schedule: Schedule; onToggle: () => void }) {
  const timeUntil = schedule.nextRunAt - Date.now();
  const isOverdue = timeUntil < 0;
  const timeLabel = isOverdue
    ? 'Overdue'
    : timeUntil < 3600000
    ? `In ${Math.round(timeUntil / 60000)}m`
    : timeUntil < 86400000
    ? `In ${Math.round(timeUntil / 3600000)}h`
    : `In ${Math.round(timeUntil / 86400000)}d`;

  return (
    <div className={`flex items-center gap-3 px-2.5 py-2 rounded-md border transition-colors ${
      schedule.status === 'active'
        ? 'border-emerald-500/15 bg-emerald-500/3'
        : 'border-border/20 bg-secondary/5 opacity-60'
    }`}>
      <div className={`rounded-lg p-1.5 ${
        schedule.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted/20 text-muted-foreground/40'
      }`}>
        <CalendarClock className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-foreground/80">{schedule.name}</span>
          <Badge variant="outline" className="text-[7px] h-3.5 px-1 border-border/20 text-muted-foreground/40">
            {schedule.agent}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-muted-foreground/40 font-mono">{schedule.cron}</span>
          <span className={`text-[9px] ${isOverdue ? 'text-red-400' : 'text-emerald-400/60'}`}>
            {timeLabel}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={onToggle}
      >
        {schedule.status === 'active' ? (
          <Pause className="h-3 w-3 text-amber-400/60" />
        ) : (
          <Play className="h-3 w-3 text-emerald-400/60" />
        )}
      </Button>
    </div>
  );
}

// ============================================================
// Follow-Up Item
// ============================================================

function FollowUpItem({ followUp, onUpdateStatus }: {
  followUp: FollowUp;
  onUpdateStatus: (id: string, status: FollowUp['status']) => void;
}) {
  const channelIcon = followUp.channel === 'Email' ? Mail : MessageCircle;
  const ChannelIcon = channelIcon;

  const statusConfig: Record<string, { color: string; icon: React.ElementType; bg: string }> = {
    pending: { color: 'text-amber-400', icon: Clock, bg: 'bg-amber-500/5 border-amber-500/15' },
    overdue: { color: 'text-red-400', icon: AlertTriangle, bg: 'bg-red-500/5 border-red-500/15' },
    completed: { color: 'text-emerald-400', icon: CheckCircle2, bg: 'bg-emerald-500/5 border-emerald-500/15' },
  };

  const config = statusConfig[followUp.status];
  const StatusIcon = config.icon;

  return (
    <div className={`flex items-start gap-2.5 px-2.5 py-2 rounded-md border ${config.bg}`}>
      <StatusIcon className={`h-3.5 w-3.5 ${config.color} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-medium ${followUp.status === 'completed' ? 'text-muted-foreground/50 line-through' : 'text-foreground/80'}`}>
          {followUp.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <ChannelIcon className="h-2.5 w-2.5 text-muted-foreground/30" />
          <span className="text-[8px] text-muted-foreground/40">{followUp.channel}</span>
          <span className="text-[8px] text-muted-foreground/30">
            {new Date(followUp.dueAt).toLocaleString()}
          </span>
        </div>
      </div>
      {followUp.status !== 'completed' && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-emerald-400/50 hover:text-emerald-400"
          onClick={() => onUpdateStatus(followUp.id, 'completed')}
        >
          <CheckCircle2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// ============================================================
// Sequence Item
// ============================================================

function SequenceItem({ sequence }: { sequence: OutreachSequence }) {
  return (
    <div className={`rounded-md border p-2.5 ${
      sequence.status === 'active' ? 'border-cyan-500/15 bg-cyan-500/3' :
      sequence.status === 'completed' ? 'border-emerald-500/15 bg-emerald-500/3' :
      'border-border/20 bg-secondary/5'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-foreground/80">{sequence.name}</span>
        <Badge variant="outline" className={`text-[7px] h-3.5 px-1 ${
          sequence.status === 'active' ? 'border-cyan-500/20 text-cyan-400' :
          sequence.status === 'completed' ? 'border-emerald-500/20 text-emerald-400' :
          'border-border/20 text-muted-foreground/40'
        }`}>
          {sequence.status}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={sequence.progress} className="h-1.5 flex-1 bg-secondary/30 [&>div]:bg-cyan-400" />
        <span className="text-[9px] text-muted-foreground/50">{sequence.completedSteps}/{sequence.steps}</span>
      </div>
    </div>
  );
}

// ============================================================
// Heartbeat Status
// ============================================================

function HeartbeatStatus() {
  const heartbeat = useVellumStore((s) => s.heartbeat);
  const statusConfig = {
    idle: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Healthy' },
    running: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Running' },
    error: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' },
  };
  const config = statusConfig[heartbeat.status];

  const timeSinceLastCheck = heartbeat.lastCheckIn
    ? Date.now() - heartbeat.lastCheckIn
    : null;
  const timeUntilNext = heartbeat.nextCheckIn
    ? heartbeat.nextCheckIn - Date.now()
    : null;

  return (
    <div className="rounded-lg border border-border/20 bg-secondary/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Heart className={`h-3.5 w-3.5 ${config.color}`} />
        <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Heartbeat</span>
        <Badge variant="outline" className={`text-[8px] h-4 px-1 ml-auto ${config.color} border-current/20`}>
          {config.label}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-[8px] text-muted-foreground/40 uppercase">Last check-in</span>
          <p className="text-[10px] text-foreground/60">
            {timeSinceLastCheck
              ? `${Math.round(timeSinceLastCheck / 60000)}m ago`
              : 'Never'}
          </p>
        </div>
        <div>
          <span className="text-[8px] text-muted-foreground/40 uppercase">Next check-in</span>
          <p className="text-[10px] text-foreground/60">
            {timeUntilNext && timeUntilNext > 0
              ? `In ${Math.round(timeUntilNext / 60000)}m`
              : 'Soon'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Add Schedule / Follow-Up Forms
// ============================================================

function QuickAddSchedule({ onAdd }: { onAdd: (s: Schedule) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: `sch-${Date.now()}`,
      name: name.trim(),
      cron: '0 9 * * *',
      nextRunAt: Date.now() + 86400000,
      lastRunAt: null,
      status: 'active',
      agent: 'Scout',
    });
    setName('');
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
        <Plus className="h-3 w-3" />Add Schedule
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border/20 bg-secondary/5 p-2.5 space-y-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Schedule name..."
        className="h-7 text-xs bg-secondary/20 border-border/30 placeholder:text-muted-foreground/30"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-6 text-[9px] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">Add</Button>
        <Button type="button" variant="ghost" size="sm" className="h-6 text-[9px] text-muted-foreground/50" onClick={() => setIsOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

function QuickAddFollowUp({ onAdd }: { onAdd: (f: FollowUp) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      id: `fu-${Date.now()}`,
      title: title.trim(),
      contactName: 'New Contact',
      dueAt: Date.now() + 86400000,
      status: 'pending',
      channel: 'Email',
    });
    setTitle('');
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
        <Plus className="h-3 w-3" />Add Follow-up
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border/20 bg-secondary/5 p-2.5 space-y-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Follow-up title..."
        className="h-7 text-xs bg-secondary/20 border-border/30 placeholder:text-muted-foreground/30"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-6 text-[9px] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">Add</Button>
        <Button type="button" variant="ghost" size="sm" className="h-6 text-[9px] text-muted-foreground/50" onClick={() => setIsOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

// ============================================================
// Main Proactivity Panel
// ============================================================

interface ProactivityPanelProps {
  className?: string;
}

export function ProactivityPanel({ className = '' }: ProactivityPanelProps) {
  const schedules = useVellumStore((s) => s.schedules);
  const followUps = useVellumStore((s) => s.followUps);
  const sequences = useVellumStore((s) => s.sequences);
  const addSchedule = useVellumStore((s) => s.addSchedule);
  const toggleSchedule = useVellumStore((s) => s.toggleSchedule);
  const addFollowUp = useVellumStore((s) => s.addFollowUp);
  const updateFollowUpStatus = useVellumStore((s) => s.updateFollowUpStatus);
  const setHeartbeat = useVellumStore((s) => s.setHeartbeat);

  const overdueCount = followUps.filter((f) => f.status === 'overdue').length;
  const pendingCount = followUps.filter((f) => f.status === 'pending').length;

  return (
    <Card className={`flex flex-col border-border/30 bg-card/50 h-full ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-rose-500/10">
            <Activity className="h-4 w-4 text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground/90">Proactivity</h3>
            <p className="text-[10px] text-muted-foreground/50">Schedules & follow-ups</p>
          </div>
          {overdueCount > 0 && (
            <Badge className="text-[8px] h-4 px-1 bg-red-500/10 text-red-400 border-red-500/20 ml-auto">
              {overdueCount} overdue
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Heartbeat */}
          <HeartbeatStatus />

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md bg-background/50 border border-border/15 p-2 text-center">
              <ListChecks className="h-3.5 w-3.5 text-emerald-400 mx-auto mb-1" />
              <span className="text-sm font-bold text-foreground/80">{schedules.filter(s => s.status === 'active').length}</span>
              <p className="text-[8px] text-muted-foreground/40">Schedules</p>
            </div>
            <div className="rounded-md bg-background/50 border border-border/15 p-2 text-center">
              <Clock className="h-3.5 w-3.5 text-amber-400 mx-auto mb-1" />
              <span className="text-sm font-bold text-foreground/80">{pendingCount}</span>
              <p className="text-[8px] text-muted-foreground/40">Pending</p>
            </div>
            <div className="rounded-md bg-background/50 border border-border/15 p-2 text-center">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 mx-auto mb-1" />
              <span className="text-sm font-bold text-foreground/80">{overdueCount}</span>
              <p className="text-[8px] text-muted-foreground/40">Overdue</p>
            </div>
          </div>

          {/* Schedules */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CalendarClock className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Schedules</span>
            </div>
            <div className="space-y-1.5">
              {schedules.map((schedule) => (
                <ScheduleItem
                  key={schedule.id}
                  schedule={schedule}
                  onToggle={() => toggleSchedule(schedule.id)}
                />
              ))}
            </div>
            <div className="mt-2">
              <QuickAddSchedule onAdd={addSchedule} />
            </div>
          </div>

          {/* Follow-ups */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowRight className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Follow-ups</span>
            </div>
            <div className="space-y-1.5">
              {followUps.map((followUp) => (
                <FollowUpItem
                  key={followUp.id}
                  followUp={followUp}
                  onUpdateStatus={updateFollowUpStatus}
                />
              ))}
            </div>
            <div className="mt-2">
              <QuickAddFollowUp onAdd={addFollowUp} />
            </div>
          </div>

          {/* Sequences */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="h-3 w-3 text-cyan-400" />
              <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Sequences</span>
            </div>
            <div className="space-y-1.5">
              {sequences.map((sequence) => (
                <SequenceItem key={sequence.id} sequence={sequence} />
              ))}
            </div>
          </div>

          {/* Trigger heartbeat */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-[10px] h-7 gap-1.5 border-border/30 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors"
            onClick={() => {
              setHeartbeat({ status: 'running', lastCheckIn: Date.now() });
              setTimeout(() => {
                setHeartbeat({ status: 'idle', nextCheckIn: Date.now() + 2700000 });
              }, 2000);
            }}
          >
            <Activity className="h-3 w-3" />Trigger Heartbeat Check
          </Button>
        </div>
      </ScrollArea>
    </Card>
  );
}
