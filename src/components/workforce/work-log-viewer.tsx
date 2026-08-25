'use client';

/**
 * Work Log Viewer — Comprehensive Time-Based Activity Log
 * ========================================================
 * Displays every action, decision, and event for an AI workforce agent
 * in a hierarchical time-based view:
 *
 *   Year → Month → Day → Hour → Log Entry
 *
 * Features:
 * - Drill-down navigation (click year → see months, click month → see days, etc.)
 * - Category filter (task, chat, health, deploy, enrich, discover, system, decision)
 * - Level filter (debug, info, warn, error, critical)
 * - Hourly activity bar chart
 * - Expandable log entries with full details
 * - Summary stats (total logs, by category, by level)
 *
 * Data is fetched from: GET /api/workforce/[id]/logs
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  Bug,
  Zap,
  Server,
  Database,
  Shield,
  DollarSign,
  MessageSquare,
  Target,
  Settings,
  Loader2,
  Filter,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────

interface WorkLogEntry {
  id: string;
  agentId: string;
  logDate: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  dayOfWeek: number;
  level: string;
  category: string;
  action: string;
  description: string;
  details: string | null;
  duration: number | null;
  createdAt: string;
}

interface LogHierarchy {
  year: number;
  logCount: number;
  months: Array<{
    month: number;
    logCount: number;
    days: Array<{
      day: number;
      hours: number[];
      logCount: number;
    }>;
  }>;
}

interface LogStats {
  totalLogs: number;
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
  byHour: number[];
}

interface WorkLogViewerProps {
  agentId: string;
  agentName: string;
  agentColor: string;
}

// ── Icons & Colors ────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  task: Target,
  chat: MessageSquare,
  health: Activity,
  deploy: Server,
  enrich: Database,
  discover: Zap,
  system: Settings,
  decision: Shield,
};

const LEVEL_ICONS: Record<string, React.ElementType> = {
  debug: Bug,
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  critical: AlertCircle,
};

const LEVEL_COLORS: Record<string, string> = {
  debug: 'text-zinc-500',
  info: 'text-blue-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  critical: 'text-red-500',
};

const CATEGORY_COLORS: Record<string, string> = {
  task: 'text-emerald-400',
  chat: 'text-cyan-400',
  health: 'text-blue-400',
  deploy: 'text-indigo-400',
  enrich: 'text-purple-400',
  discover: 'text-pink-400',
  system: 'text-zinc-400',
  decision: 'text-amber-400',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Component ─────────────────────────────────────────────────────────

export function WorkLogViewer({ agentId, agentName, agentColor }: WorkLogViewerProps) {
  const [hierarchy, setHierarchy] = useState<LogHierarchy[] | null>(null);
  const [logs, setLogs] = useState<WorkLogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Drill-down state
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  // ── Fetch hierarchy (summary) ──
  const fetchHierarchy = useCallback(async () => {
    try {
      const res = await fetch(`/api/workforce/${agentId}/logs`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setHierarchy(data.hierarchy || []);
      setStats({
        totalLogs: data.totalLogs || 0,
        byCategory: data.byCategory || {},
        byLevel: data.byLevel || {},
        byHour: new Array(24).fill(0),
      });
    } catch (err) {
      console.error('[WorkLogViewer] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // ── Fetch detailed logs ──
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.set('year', String(selectedYear));
      if (selectedMonth) params.set('month', String(selectedMonth));
      if (selectedDay) params.set('day', String(selectedDay));
      if (selectedHour) params.set('hour', String(selectedHour));
      if (categoryFilter) params.set('category', categoryFilter);
      if (levelFilter) params.set('level', levelFilter);
      params.set('limit', '200');

      const res = await fetch(`/api/workforce/${agentId}/logs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data.logs || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('[WorkLogViewer] Fetch logs error:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId, selectedYear, selectedMonth, selectedDay, selectedHour, categoryFilter, levelFilter]);

  // ── Initial load ──
  useEffect(() => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);
    setSelectedHour(null);
    setLogs([]);
    fetchHierarchy();
  }, [agentId, fetchHierarchy]);

  // ── Fetch logs when drill-down changes ──
  useEffect(() => {
    if (selectedYear !== null) {
      fetchLogs();
    }
  }, [selectedYear, selectedMonth, selectedDay, selectedHour, categoryFilter, levelFilter, fetchLogs]);

  // ── Breadcrumb reset ──
  const resetDrillDown = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);
    setSelectedHour(null);
    setLogs([]);
    fetchHierarchy();
  };

  // ── Render stats cards ──
  const renderStats = () => {
    if (!stats) return null;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <div>
                <p className="text-lg font-bold text-foreground">{stats.totalLogs}</p>
                <p className="text-[10px] text-foreground/40">Total Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-lg font-bold text-foreground">{stats.byCategory.task || 0}</p>
                <p className="text-[10px] text-foreground/40">Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-lg font-bold text-foreground">{stats.byCategory.chat || 0}</p>
                <p className="text-[10px] text-foreground/40">Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <div>
                <p className="text-lg font-bold text-foreground">
                  {(stats.byLevel.warn || 0) + (stats.byLevel.error || 0)}
                </p>
                <p className="text-[10px] text-foreground/40">Warnings/Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ── Render hourly activity chart ──
  const renderHourlyChart = () => {
    if (!stats?.byHour) return null;
    const maxHour = Math.max(...stats.byHour, 1);

    return (
      <Card className="bg-card/50 border-border/30 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs text-foreground/60">
            <Clock className="h-3.5 w-3.5" />
            Hourly Activity Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-0.5 h-20">
            {stats.byHour.map((count, hour) => (
              <div
                key={hour}
                className="flex-1 flex flex-col items-center gap-0.5 group relative"
                title={`${hour}:00 — ${count} entries`}
              >
                <div
                  className="w-full rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${Math.max(2, (count / maxHour) * 100)}%`,
                    backgroundColor: count > 0 ? agentColor : 'rgba(100,116,139,0.2)',
                    opacity: count > 0 ? 0.7 : 0.3,
                  }}
                />
                {hour % 3 === 0 && (
                  <span className="text-[7px] text-foreground/30">{hour}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ── Render breadcrumb ──
  const renderBreadcrumb = () => {
    const crumbs: Array<{ label: string; onClick?: () => void }> = [
      { label: 'All Time', onClick: resetDrillDown },
    ];
    if (selectedYear) crumbs.push({ label: String(selectedYear), onClick: () => { setSelectedMonth(null); setSelectedDay(null); setSelectedHour(null); } });
    if (selectedMonth) crumbs.push({ label: MONTH_NAMES[selectedMonth - 1], onClick: () => { setSelectedDay(null); setSelectedHour(null); } });
    if (selectedDay) crumbs.push({ label: `${MONTH_NAMES[(selectedMonth || 1) - 1]} ${selectedDay}`, onClick: () => setSelectedHour(null) });
    if (selectedHour !== null) crumbs.push({ label: `${selectedHour}:00` });

    return (
      <div className="flex items-center gap-1 text-xs text-foreground/50 mb-3 flex-wrap">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            {crumb.onClick ? (
              <button
                onClick={crumb.onClick}
                className="hover:text-foreground hover:underline"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>
    );
  };

  // ── Render hierarchy view (when no year selected) ──
  const renderHierarchy = () => {
    if (!hierarchy || hierarchy.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-10 w-10 text-foreground/20 mb-3" />
          <p className="text-sm text-foreground/40">No work logs yet</p>
          <p className="text-xs text-foreground/25 mt-1">
            Activity logs will appear here as {agentName} works
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {hierarchy.map((yearData) => (
          <div key={yearData.year} className="rounded-lg border border-border/30 overflow-hidden">
            <button
              onClick={() => setSelectedYear(yearData.year)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4" style={{ color: agentColor }} />
                <span className="text-sm font-medium text-foreground/80">{yearData.year}</span>
                <Badge variant="outline" className="text-[9px] border-border/30 text-foreground/40">
                  {yearData.logCount} entries
                </Badge>
                <Badge variant="outline" className="text-[9px] border-border/30 text-foreground/40">
                  {yearData.months.length} months
                </Badge>
              </div>
              <ChevronRight className="h-4 w-4 text-foreground/30" />
            </button>
            {/* Expand months inline */}
            {selectedYear === yearData.year && (
              <div className="border-t border-border/20 bg-background/30">
                {yearData.months.map((monthData) => (
                  <div key={monthData.month} className="border-b border-border/10 last:border-0">
                    <button
                      onClick={() => setSelectedMonth(monthData.month)}
                      className="w-full flex items-center justify-between px-8 py-2 hover:bg-secondary/20 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-foreground/60">{MONTH_NAMES[monthData.month - 1]}</span>
                        <Badge variant="outline" className="text-[8px] border-border/30 text-foreground/40">
                          {monthData.logCount} entries
                        </Badge>
                        <Badge variant="outline" className="text-[8px] border-border/30 text-foreground/40">
                          {monthData.days.length} days
                        </Badge>
                      </div>
                      <ChevronRight className="h-3 w-3 text-foreground/30" />
                    </button>
                    {/* Expand days */}
                    {selectedMonth === monthData.month && (
                      <div className="border-t border-border/10 bg-background/20">
                        {monthData.days.map((dayData) => (
                          <div key={dayData.day} className="border-b border-border/10 last:border-0">
                            <button
                              onClick={() => setSelectedDay(dayData.day)}
                              className="w-full flex items-center justify-between px-12 py-2 hover:bg-secondary/10 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-foreground/50">
                                  {MONTH_NAMES[monthData.month - 1]} {dayData.day}
                                </span>
                                <Badge variant="outline" className="text-[8px] border-border/30 text-foreground/40">
                                  {dayData.logCount} entries
                                </Badge>
                                <Badge variant="outline" className="text-[8px] border-border/30 text-foreground/40">
                                  {dayData.hours.length} hours
                                </Badge>
                              </div>
                              <ChevronRight className="h-3 w-3 text-foreground/30" />
                            </button>
                            {/* Expand hours */}
                            {selectedDay === dayData.day && (
                              <div className="flex flex-wrap gap-1 px-12 py-2 border-t border-border/10 bg-background/10">
                                {dayData.hours.map((h) => (
                                  <button
                                    key={h}
                                    onClick={() => setSelectedHour(h)}
                                    className={`px-2 py-1 rounded text-[10px] transition-colors ${
                                      selectedHour === h
                                        ? 'text-foreground font-medium'
                                        : 'text-foreground/40 hover:text-foreground/70'
                                    }`}
                                    style={{
                                      backgroundColor: selectedHour === h ? `${agentColor}30` : 'rgba(100,116,139,0.1)',
                                    }}
                                  >
                                    {h}:00
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ── Render individual log entries ──
  const renderLogs = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
        </div>
      );
    }

    if (logs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Filter className="h-10 w-10 text-foreground/20 mb-3" />
          <p className="text-sm text-foreground/40">No logs match the current filters</p>
          <p className="text-xs text-foreground/25 mt-1">Try adjusting the time range or category</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {logs.map((log) => {
          const CategoryIcon = CATEGORY_ICONS[log.category] || Activity;
          const LevelIcon = LEVEL_ICONS[log.level] || Info;
          const isExpanded = expandedEntry === log.id;

          return (
            <div
              key={log.id}
              className={`rounded-lg border transition-all ${
                isExpanded ? 'border-border/50 bg-secondary/20' : 'border-border/20 hover:border-border/40'
              }`}
            >
              <button
                onClick={() => setExpandedEntry(isExpanded ? null : log.id)}
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left"
              >
                {/* Time */}
                <div className="shrink-0 text-[10px] text-foreground/40 font-mono pt-0.5">
                  {new Date(log.logDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>

                {/* Category icon */}
                <div className={`shrink-0 ${CATEGORY_COLORS[log.category] || 'text-foreground/40'}`}>
                  <CategoryIcon className="h-3.5 w-3.5" />
                </div>

                {/* Level icon */}
                <div className={`shrink-0 ${LEVEL_COLORS[log.level] || 'text-foreground/40'}`}>
                  <LevelIcon className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className={`text-[8px] border-border/30 capitalize ${CATEGORY_COLORS[log.category] || ''}`}>
                      {log.category}
                    </Badge>
                    <Badge variant="outline" className={`text-[8px] border-border/30 capitalize ${LEVEL_COLORS[log.level] || ''}`}>
                      {log.level}
                    </Badge>
                    <span className="text-[10px] text-foreground/30 font-mono">{log.action}</span>
                    {log.duration && (
                      <span className="text-[9px] text-foreground/30">
                        {(log.duration / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">
                    {log.description}
                  </p>
                </div>

                {/* Expand indicator */}
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-foreground/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded details */}
              {isExpanded && log.details && (
                <div className="px-3 pb-3 pt-0">
                  <div className="ml-16 rounded-md border border-border/20 bg-background/50 p-2">
                    <pre className="text-[10px] text-foreground/50 font-mono whitespace-pre-wrap break-all">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(log.details!), null, 2);
                        } catch {
                          return log.details;
                        }
                      })()}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Render filter bar ──
  const renderFilters = () => {
    const categories = ['task', 'chat', 'health', 'deploy', 'enrich', 'discover', 'system', 'decision'];
    const levels = ['debug', 'info', 'warn', 'error', 'critical'];

    return (
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-foreground/30" />
          <span className="text-[10px] text-foreground/40">Filters:</span>
        </div>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
            className={`px-2 py-0.5 rounded-full text-[9px] transition-colors capitalize ${
              categoryFilter === cat
                ? 'text-foreground font-medium'
                : 'text-foreground/40 hover:text-foreground/70'
            }`}
            style={{
              backgroundColor: categoryFilter === cat ? `${agentColor}30` : 'rgba(100,116,139,0.1)',
            }}
          >
            {cat}
          </button>
        ))}
        <div className="w-px h-4 bg-border/30 mx-1" />
        {levels.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setLevelFilter(levelFilter === lvl ? null : lvl)}
            className={`px-2 py-0.5 rounded-full text-[9px] transition-colors capitalize ${
              levelFilter === lvl
                ? 'text-foreground font-medium'
                : 'text-foreground/40 hover:text-foreground/70'
            }`}
            style={{
              backgroundColor: levelFilter === lvl ? `${agentColor}30` : 'rgba(100,116,139,0.1)',
            }}
          >
            {lvl}
          </button>
        ))}
      </div>
    );
  };

  // ── Main render ──
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {renderStats()}
      {renderHourlyChart()}
      {renderBreadcrumb()}
      {selectedYear && renderFilters()}
      <Card className="bg-card/50 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-foreground/60">
            <Activity className="h-4 w-4" style={{ color: agentColor }} />
            {selectedYear ? 'Log Entries' : 'Time-Based Activity'}
            {logs.length > 0 && (
              <Badge variant="outline" className="text-[9px] border-border/30 text-foreground/40">
                {selectedYear ? logs.length : hierarchy?.reduce((s, y) => s + y.logCount, 0) || 0} entries
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-3">
            {selectedYear ? renderLogs() : renderHierarchy()}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
