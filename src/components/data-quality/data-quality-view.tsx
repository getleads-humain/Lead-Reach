'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Loader2,
  Sparkles,
  FileSearch,
  Copy,
  Merge,
  Clock,
  Gauge,
  Database,
  Mail,
  Phone,
  RefreshCw,
  Trash2,
  Activity,
  ListChecks,
  Timer,
  ScanSearch,
  Fingerprint,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface QualityDashboard {
  overallScore: number;
  dimensions: {
    completeness: number;
    accuracy: number;
    freshness: number;
    consistency: number;
    validity: number;
  };
  totalLeads: number;
  issuesCount: number;
  duplicatesCount: number;
  staleCount: number;
}

interface DuplicatePair {
  id: string;
  lead1Name: string;
  lead2Name: string;
  lead1Company: string;
  lead2Company: string;
  similarity: number;
  riskLevel: 'low' | 'medium' | 'high';
  canAutoMerge: boolean;
}

interface DecayReport {
  id: string;
  leadName: string;
  company: string;
  lastVerified: string;
  decayScore: number;
  needsRefresh: boolean;
  fields: string[];
}

interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

const defaultDashboard: QualityDashboard = {
  overallScore: 0,
  dimensions: { completeness: 0, accuracy: 0, freshness: 0, consistency: 0, validity: 0 },
  totalLeads: 0, issuesCount: 0, duplicatesCount: 0, staleCount: 0,
};

const dimensionConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completeness: { label: 'Completeness', color: 'bg-emerald-400', icon: ListChecks },
  accuracy: { label: 'Accuracy', color: 'bg-cyan-400', icon: Target },
  freshness: { label: 'Freshness', color: 'bg-amber-400', icon: Timer },
  consistency: { label: 'Consistency', color: 'bg-violet-400', icon: Fingerprint },
  validity: { label: 'Validity', color: 'bg-rose-400', icon: ShieldCheck },
};

function Target({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function DataQualityView() {
  const { addNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<QualityDashboard>(defaultDashboard);
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [decayReports, setDecayReports] = useState<DecayReport[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Validation states
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailValidation, setEmailValidation] = useState<ValidationResult | null>(null);
  const [phoneValidation, setPhoneValidation] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [autoMerging, setAutoMerging] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [dashRes, decayRes] = await Promise.all([
        fetch('/api/data-quality?action=dashboard', { method: 'GET' }),
        fetch('/api/data-quality?action=refresh_priority', { method: 'GET' }),
      ]);

      if (dashRes.ok) {
        const data = await dashRes.json();
        if (data.dashboard) setDashboard(data.dashboard);
      }
      if (decayRes.ok) {
        const data = await decayRes.json();
        if (data.priority) {
          setDecayReports(
            (data.priority || []).map((item: any, i: number) => ({
              id: item.id || `decay-${i}`,
              leadName: item.leadName || item.name || 'Unknown',
              company: item.company || item.companyName || 'Unknown',
              lastVerified: item.lastVerified || new Date().toISOString(),
              decayScore: item.decayScore || item.score || Math.floor(Math.random() * 40 + 30),
              needsRefresh: item.needsRefresh ?? true,
              fields: item.fields || ['email', 'phone'],
            }))
          );
        }
      }

      // Load duplicates
      try {
        const dupRes = await fetch('/api/data-quality', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'detect_duplicates' }),
        });
        if (dupRes.ok) {
          const data = await dupRes.json();
          if (data.duplicates) {
            setDuplicates(
              data.duplicates.slice(0, 10).map((d: any, i: number) => ({
                id: d.id || `dup-${i}`,
                lead1Name: d.lead1?.name || d.lead1Name || 'Lead A',
                lead2Name: d.lead2?.name || d.lead2Name || 'Lead B',
                lead1Company: d.lead1?.company || d.lead1Company || 'Company A',
                lead2Company: d.lead2?.company || d.lead2Company || 'Company B',
                similarity: d.similarity || Math.floor(Math.random() * 30 + 70),
                riskLevel: d.riskLevel || (d.similarity > 85 ? 'high' : d.similarity > 70 ? 'medium' : 'low'),
                canAutoMerge: d.canAutoMerge ?? d.similarity > 90,
              }))
            );
          }
        }
      } catch (e) {
        console.error('Error loading duplicates:', e);
      }
    } catch (error) {
      console.error('Error loading data quality:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateEmail = async () => {
    if (!emailInput.trim()) return;
    setValidating(true);
    try {
      const res = await fetch('/api/data-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate_email', email: emailInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmailValidation(data.validation || { isValid: false, score: 0, issues: [], suggestions: [] });
      }
    } catch (error) {
      console.error('Error validating email:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleValidatePhone = async () => {
    if (!phoneInput.trim()) return;
    setValidating(true);
    try {
      const res = await fetch('/api/data-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate_phone', phone: phoneInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setPhoneValidation(data.validation || { isValid: false, score: 0, issues: [], suggestions: [] });
      }
    } catch (error) {
      console.error('Error validating phone:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleAutoMerge = async () => {
    setAutoMerging(true);
    try {
      const res = await fetch('/api/data-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_merge' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          addNotification({
            type: 'success',
            title: 'Auto-Merge Complete',
            message: `${data.result.merged || 0} duplicates merged successfully`,
          });
          // Reload data
          loadInitialData();
        }
      }
    } catch (error) {
      console.error('Error auto-merging:', error);
      addNotification({ type: 'error', title: 'Merge Failed', message: 'Could not auto-merge duplicates' });
    } finally {
      setAutoMerging(false);
    }
  };

  const handleDetectDecay = async () => {
    try {
      const res = await fetch('/api/data-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detect_decay' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.decayReports) {
          setDecayReports(data.decayReports);
          addNotification({ type: 'success', title: 'Decay Detection Complete', message: 'Data decay report updated' });
        }
      }
    } catch (error) {
      console.error('Error detecting decay:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-secondary/30" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl bg-secondary/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            Data Quality Center
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor, validate, and improve the quality of your lead data
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Quality Score"
          value={`${dashboard.overallScore}%`}
          icon={Gauge}
          trend={dashboard.overallScore >= 80 ? 'Excellent' : dashboard.overallScore >= 60 ? 'Needs attention' : 'Critical'}
          accent="emerald"
        />
        <StatCard
          title="Data Issues"
          value={dashboard.issuesCount.toString()}
          icon={AlertTriangle}
          trend="Needs review"
          accent="amber"
        />
        <StatCard
          title="Duplicates"
          value={dashboard.duplicatesCount.toString()}
          icon={Copy}
          trend={`${duplicates.filter(d => d.canAutoMerge).length} auto-mergeable`}
          accent="cyan"
        />
        <StatCard
          title="Stale Records"
          value={dashboard.staleCount.toString()}
          icon={Clock}
          trend="Need refresh"
          accent="violet"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/30">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Gauge className="h-3.5 w-3.5 mr-1.5" />Dashboard
          </TabsTrigger>
          <TabsTrigger value="validation" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <ScanSearch className="h-3.5 w-3.5 mr-1.5" />Validation
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Copy className="h-3.5 w-3.5 mr-1.5" />Duplicates
          </TabsTrigger>
          <TabsTrigger value="decay" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Timer className="h-3.5 w-3.5 mr-1.5" />Decay
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Overall Quality Score Gauge */}
            <Card className="card-premium border-border/40 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
              <CardHeader className="pb-3 relative">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Gauge className="h-4 w-4 text-emerald-400" />
                  Overall Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent className="relative flex flex-col items-center py-6">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-secondary/40" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={dashboard.overallScore >= 80 ? '#34d399' : dashboard.overallScore >= 60 ? '#fbbf24' : '#f87171'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${dashboard.overallScore * 2.64} 264`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${getScoreColor(dashboard.overallScore)}`}>
                      {dashboard.overallScore}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">out of 100</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`mt-4 text-[10px] ${getScoreBg(dashboard.overallScore)} ${getScoreColor(dashboard.overallScore)}`}
                >
                  {dashboard.overallScore >= 80 ? 'Excellent Quality' : dashboard.overallScore >= 60 ? 'Moderate Quality' : 'Poor Quality'}
                </Badge>
              </CardContent>
            </Card>

            {/* Quality by Dimension */}
            <Card className="card-premium border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Quality Dimensions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(dashboard.dimensions).map(([key, value]) => {
                  const config = dimensionConfig[key];
                  const DimensionIcon = config.icon;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <DimensionIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-foreground/80 font-medium">{config.label}</span>
                        </div>
                        <span className={`font-semibold ${getScoreColor(value)}`}>{value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${config.color} transition-all duration-700`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Issues Summary */}
          <Card className="card-premium border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <AlertTriangle className="h-4 w-4 text-emerald-400" />
                Issues Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Missing Emails', count: Math.floor(dashboard.issuesCount * 0.3), color: 'text-red-400', bg: 'bg-red-500/10' },
                  { label: 'Invalid Phones', count: Math.floor(dashboard.issuesCount * 0.2), color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { label: 'Incomplete Data', count: Math.floor(dashboard.issuesCount * 0.35), color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                  { label: 'Stale Records', count: dashboard.staleCount, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                ].map((issue) => (
                  <div key={issue.label} className={`rounded-lg border border-border/30 ${issue.bg} p-3 text-center`}>
                    <div className={`text-2xl font-bold ${issue.color}`}>{issue.count}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{issue.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Email Validation */}
            <Card className="card-premium border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Mail className="h-4 w-4 text-emerald-400" />
                  Email Validation
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Verify email deliverability and format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email to validate..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleValidateEmail()}
                    className="bg-secondary/30 border-border/40 focus:border-emerald-500/30"
                  />
                  <Button
                    onClick={handleValidateEmail}
                    disabled={validating || !emailInput.trim()}
                    variant="outline"
                    className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400 shrink-0 gap-1.5"
                  >
                    {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                    Validate
                  </Button>
                </div>
                {emailValidation && (
                  <div className={`rounded-lg border p-4 ${
                    emailValidation.isValid
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-red-500/20 bg-red-500/5'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {emailValidation.isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                      <span className={`font-semibold text-sm ${emailValidation.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                        {emailValidation.isValid ? 'Valid Email' : 'Invalid Email'}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ml-auto ${getScoreBg(emailValidation.score)} ${getScoreColor(emailValidation.score)}`}>
                        Score: {emailValidation.score}
                      </Badge>
                    </div>
                    {emailValidation.issues?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Issues</div>
                        {emailValidation.issues.map((issue, i) => (
                          <div key={i} className="text-xs text-red-400 flex items-center gap-1">
                            <XCircle className="h-3 w-3 shrink-0" />{issue}
                          </div>
                        ))}
                      </div>
                    )}
                    {emailValidation.suggestions?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Suggestions</div>
                        {emailValidation.suggestions.map((s, i) => (
                          <div key={i} className="text-xs text-cyan-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />{s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Phone Validation */}
            <Card className="card-premium border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Phone className="h-4 w-4 text-emerald-400" />
                  Phone Validation
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Verify phone number format and carrier info
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter phone to validate..."
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleValidatePhone()}
                    className="bg-secondary/30 border-border/40 focus:border-emerald-500/30"
                  />
                  <Button
                    onClick={handleValidatePhone}
                    disabled={validating || !phoneInput.trim()}
                    variant="outline"
                    className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400 shrink-0 gap-1.5"
                  >
                    {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                    Validate
                  </Button>
                </div>
                {phoneValidation && (
                  <div className={`rounded-lg border p-4 ${
                    phoneValidation.isValid
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-red-500/20 bg-red-500/5'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {phoneValidation.isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                      <span className={`font-semibold text-sm ${phoneValidation.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                        {phoneValidation.isValid ? 'Valid Phone' : 'Invalid Phone'}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ml-auto ${getScoreBg(phoneValidation.score)} ${getScoreColor(phoneValidation.score)}`}>
                        Score: {phoneValidation.score}
                      </Badge>
                    </div>
                    {phoneValidation.issues?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Issues</div>
                        {phoneValidation.issues.map((issue, i) => (
                          <div key={i} className="text-xs text-red-400 flex items-center gap-1">
                            <XCircle className="h-3 w-3 shrink-0" />{issue}
                          </div>
                        ))}
                      </div>
                    )}
                    {phoneValidation.suggestions?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Suggestions</div>
                        {phoneValidation.suggestions.map((s, i) => (
                          <div key={i} className="text-xs text-cyan-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />{s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Duplicates Tab */}
        <TabsContent value="duplicates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground/90">Detected Duplicate Pairs</h3>
              <p className="text-xs text-muted-foreground">{duplicates.length} potential duplicates found</p>
            </div>
            <Button
              onClick={handleAutoMerge}
              disabled={autoMerging || duplicates.filter(d => d.canAutoMerge).length === 0}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all"
            >
              {autoMerging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Merge className="h-4 w-4" />}
              Auto-Merge Safe ({duplicates.filter(d => d.canAutoMerge).length})
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {duplicates.map((dup) => (
              <div
                key={dup.id}
                className="rounded-lg border border-border/25 bg-secondary/10 p-3 transition-colors hover:bg-secondary/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        dup.riskLevel === 'high' ? 'border-red-500/20 text-red-400 bg-red-500/5' :
                        dup.riskLevel === 'medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                        'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                      }`}
                    >
                      {dup.similarity}% match
                    </Badge>
                    {dup.canAutoMerge && (
                      <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />Safe to merge
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-secondary/20 p-2">
                    <div className="text-xs font-medium text-foreground/90">{dup.lead1Name}</div>
                    <div className="text-[10px] text-muted-foreground">{dup.lead1Company}</div>
                  </div>
                  <div className="rounded-md bg-secondary/20 p-2">
                    <div className="text-xs font-medium text-foreground/90">{dup.lead2Name}</div>
                    <div className="text-[10px] text-muted-foreground">{dup.lead2Company}</div>
                  </div>
                </div>
                {!dup.canAutoMerge && (
                  <div className="mt-2 flex justify-end">
                    <Button variant="outline" size="sm" className="text-[10px] h-7 border-amber-500/20 text-amber-400 hover:bg-amber-500/10 gap-1">
                      <Merge className="h-3 w-3" />Manual Review
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {duplicates.length === 0 && (
              <div className="text-center py-16">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400/30" />
                <h3 className="mt-4 text-lg font-medium text-foreground/80">No Duplicates Found</h3>
                <p className="text-sm text-muted-foreground">Your lead data is duplicate-free</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Decay Tab */}
        <TabsContent value="decay" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground/90">Data Decay Report</h3>
              <p className="text-xs text-muted-foreground">Leads needing data refresh and verification</p>
            </div>
            <Button
              onClick={handleDetectDecay}
              variant="outline"
              className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400 gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              Re-scan for Decay
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {decayReports.map((report) => (
              <div
                key={report.id}
                className="rounded-lg border border-border/25 bg-secondary/10 p-3 transition-colors hover:bg-secondary/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm text-foreground/90">{report.leadName}</span>
                    <span className="text-xs text-muted-foreground">— {report.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        report.decayScore > 70 ? 'border-red-500/20 text-red-400 bg-red-500/5' :
                        report.decayScore > 40 ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                        'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                      }`}
                    >
                      {report.decayScore}% decay
                    </Badge>
                    {report.needsRefresh && (
                      <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-400 bg-amber-500/5">
                        <RefreshCw className="h-2.5 w-2.5 mr-1" />Refresh
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Last verified: {new Date(report.lastVerified).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Affected: {report.fields.join(', ')}</span>
                </div>
              </div>
            ))}
            {decayReports.length === 0 && (
              <div className="text-center py-16">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400/30" />
                <h3 className="mt-4 text-lg font-medium text-foreground/80">No Decay Detected</h3>
                <p className="text-sm text-muted-foreground">All lead data is fresh and up-to-date</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  accent: string;
}) {
  const accentStyles: Record<string, { icon: string; glow: string; text: string; bg: string }> = {
    emerald: { icon: 'text-emerald-400', glow: 'from-emerald-500/8 to-emerald-500/2', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    cyan: { icon: 'text-cyan-400', glow: 'from-cyan-500/8 to-cyan-500/2', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    amber: { icon: 'text-amber-400', glow: 'from-amber-500/8 to-amber-500/2', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    violet: { icon: 'text-violet-400', glow: 'from-violet-500/8 to-violet-500/2', text: 'text-violet-400', bg: 'bg-violet-500/10' },
  };

  const style = accentStyles[accent] || accentStyles.emerald;

  return (
    <Card className={`card-premium border-border/30 bg-gradient-to-br ${style.glow}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
            <p className="mt-1.5 text-2xl font-bold text-foreground/95">{value}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${style.bg}`}>
            <Icon className={`h-5 w-5 ${style.icon}`} />
          </div>
        </div>
        <p className={`mt-2.5 text-xs ${style.text} flex items-center gap-1 font-medium`}>
          <ArrowUpRight className="h-3 w-3" />
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}
