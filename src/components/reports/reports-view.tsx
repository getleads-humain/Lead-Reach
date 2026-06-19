'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Download,
  FileSpreadsheet,
  BarChart3,
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  FileText,
  Loader2,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { safeFetchJSON } from '@/lib/utils';
import { useAIOneShot } from '@/hooks/use-ai-chat';

interface ReportData {
  totalLeads: number;
  totalCampaigns: number;
  qualifiedLeads: number;
  contactedLeads: number;
  respondedLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  avgScore: number;
  leadsByIndustry: Record<string, number>;
  leadsByStage: Record<string, number>;
  leadsByCountry: Record<string, number>;
}

export function ReportsView() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<string>('full');
  const [exportSuccess, setExportSuccess] = useState(false);

  // AI Report Summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const { generate: aiGenerate, isLoading: aiIsLoading } = useAIOneShot();

  // Full AI Report state (multi-section structured report)
  const [aiReport, setAiReport] = useState<{
    title: string;
    type: string;
    sections: Array<{ title: string; content: string }>;
    keyFindings: string[];
    recommendations: string[];
  } | null>(null);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiReportError, setAiReportError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const [campaigns, leadsData] = await Promise.all([
        safeFetchJSON<Array<{ id: string; name: string; status: string; targetIndustry?: string; targetLocation?: string; leadsFound: number; leadsQualified: number; leadsContacted: number; leadsResponded: number }>>('/api/campaigns'),
        safeFetchJSON<{ leads: Array<{ stage: string; leadTier: string; industry: string | null; country: string | null; leadScore: number }>; total: number }>('/api/leads?limit=1000'),
      ]);
      const leads = leadsData.leads || [];

      const qualified = leads.filter((l: { stage: string }) =>
        ['qualified', 'contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage)
      );
      const contacted = leads.filter((l: { stage: string }) =>
        ['contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage)
      );
      const responded = leads.filter((l: { stage: string }) =>
        ['engaged', 'negotiating', 'closed_won'].includes(l.stage)
      );

      const leadsByIndustry: Record<string, number> = {};
      const leadsByStage: Record<string, number> = {};
      const leadsByCountry: Record<string, number> = {};

      for (const lead of leads) {
        if (lead.industry) {
          leadsByIndustry[lead.industry] = (leadsByIndustry[lead.industry] || 0) + 1;
        }
        leadsByStage[lead.stage] = (leadsByStage[lead.stage] || 0) + 1;
        if (lead.country) {
          leadsByCountry[lead.country] = (leadsByCountry[lead.country] || 0) + 1;
        }
      }

      setReportData({
        totalLeads: leads.length,
        totalCampaigns: campaigns.length,
        qualifiedLeads: qualified.length,
        contactedLeads: contacted.length,
        respondedLeads: responded.length,
        hotLeads: leads.filter((l: { leadTier: string }) => l.leadTier === 'hot').length,
        warmLeads: leads.filter((l: { leadTier: string }) => l.leadTier === 'warm').length,
        coldLeads: leads.filter((l: { leadTier: string }) => l.leadTier === 'cold').length,
        avgScore: leads.length > 0 ? Math.round(leads.reduce((a: number, l: { leadScore: number }) => a + l.leadScore, 0) / leads.length) : 0,
        leadsByIndustry,
        leadsByStage,
        leadsByCountry,
      });
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async () => {
    if (!reportData) return;
    setAiSummaryLoading(true);
    try {
      const topIndustries = Object.entries(reportData.leadsByIndustry)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([industry, count]) => `${industry}: ${count}`)
        .join(', ');

      const topCountries = Object.entries(reportData.leadsByCountry)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([country, count]) => `${country}: ${count}`)
        .join(', ');

      const stageBreakdown = Object.entries(reportData.leadsByStage)
        .map(([stage, count]) => `${stage}: ${count}`)
        .join(', ');

      const qualificationRate = Math.round((reportData.qualifiedLeads / Math.max(reportData.totalLeads, 1)) * 100);
      const contactRate = Math.round((reportData.contactedLeads / Math.max(reportData.totalLeads, 1)) * 100);
      const responseRate = reportData.contactedLeads > 0
        ? Math.round((reportData.respondedLeads / reportData.contactedLeads) * 100)
        : 0;

      const result = await aiGenerate(
        `Generate an executive summary for this LeadReach B2B lead generation report:

OVERVIEW:
- Total Leads: ${reportData.totalLeads}
- Total Campaigns: ${reportData.totalCampaigns}
- Qualified Leads: ${reportData.qualifiedLeads} (${qualificationRate}% qualification rate)
- Contacted Leads: ${reportData.contactedLeads} (${contactRate}% contact rate)
- Responded Leads: ${reportData.respondedLeads} (${responseRate}% response rate)
- Average Score: ${reportData.avgScore}/100

TIER DISTRIBUTION:
- Hot: ${reportData.hotLeads} (${Math.round((reportData.hotLeads / Math.max(reportData.totalLeads, 1)) * 100)}%)
- Warm: ${reportData.warmLeads} (${Math.round((reportData.warmLeads / Math.max(reportData.totalLeads, 1)) * 100)}%)
- Cold: ${reportData.coldLeads} (${Math.round((reportData.coldLeads / Math.max(reportData.totalLeads, 1)) * 100)}%)

PIPELINE STAGES: ${stageBreakdown}

TOP INDUSTRIES: ${topIndustries}

TOP COUNTRIES: ${topCountries}

Provide a concise executive summary with:
1. Key performance highlights
2. Pipeline health assessment
3. Top opportunities
4. Recommended actions

Keep it professional, data-driven, and under 200 words.`,
        'You are a B2B sales analytics expert writing an executive summary for C-suite stakeholders. Be concise, data-driven, and actionable. Use specific numbers. Format with bullet points and clear sections.'
      );
      if (result) setAiSummary(result);
    } catch {
      // Silently fail — summary is nice-to-have
    } finally {
      setAiSummaryLoading(false);
    }
  };

  // Generate a full structured AI report (multi-section, saved to DB)
  const generateFullAIReport = async (reportType: 'pipeline_snapshot' | 'campaign_performance' | 'prospect_profile' | 'market_analysis' = 'pipeline_snapshot') => {
    setAiReportLoading(true);
    setAiReportError(null);
    try {
      const data = await safeFetchJSON<{
        report: {
          title: string;
          type: string;
          sections: Array<{ title: string; content: string }>;
          keyFindings: string[];
          recommendations: string[];
        };
        savedReportId?: string;
      }>('/api/reports/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType, save: true }),
      });
      if (data?.report) {
        setAiReport(data.report);
      } else {
        setAiReportError('AI report generation returned no result.');
      }
    } catch (err) {
      setAiReportError(err instanceof Error ? err.message : 'AI report generation failed');
    } finally {
      setAiReportLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const leadsRes = await safeFetchJSON<{ leads: Array<Record<string, unknown>> }>('/api/leads?limit=1000');
      const leads = leadsRes.leads || [];

      let csv = '';
      if (exportType === 'full') {
        csv = 'Company,Industry,Location,Phone,Email,Website,Employees,Revenue,Score,Tier,Stage,Key Contact\n';
        for (const lead of leads) {
          csv += `"${lead.companyName}","${lead.industry || ''}","${lead.city || ''}, ${lead.country || ''}","${lead.phoneMain || ''}","${lead.generalEmail || ''}","${lead.website || ''}","${lead.employeeCount || ''}","${lead.revenueEstimate || ''}",${lead.leadScore},"${lead.leadTier}","${lead.stage}","${lead.keyContactName || ''}"\n`;
        }
      } else if (exportType === 'campaign') {
        const campaigns = await safeFetchJSON<Array<Record<string, unknown>>>('/api/campaigns');
        csv = 'Campaign,Status,Industry,Location,Found,Qualified,Contacted,Responded\n';
        for (const c of campaigns) {
          csv += `"${c.name}","${c.status}","${c.targetIndustry || ''}","${c.targetLocation || ''}",${c.leadsFound},${c.leadsQualified},${c.leadsContacted},${c.leadsResponded}\n`;
        }
      } else if (exportType === 'scores') {
        csv = 'Company,Score,Tier,Firmographic,Intent,Reachability,Strategic,Data Quality,Stage\n';
        for (const lead of leads) {
          csv += `"${lead.companyName}",${lead.leadScore},"${lead.leadTier}",${lead.firmographicScore},${lead.intentScore},${lead.reachabilityScore},${lead.strategicScore},${lead.dataCompleteness},"${lead.stage}"\n`;
        }
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leadreach-${exportType}-report.csv`;
      link.click();
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  };

  if (loading || !reportData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-secondary/30" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl bg-secondary/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports</h2>
          <p className="text-sm text-muted-foreground">
            Campaign analytics and data export
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateAISummary}
            disabled={aiSummaryLoading || aiIsLoading}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400 font-semibold gap-2 transition-all duration-200"
          >
            {aiSummaryLoading || aiIsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Executive Summary
          </Button>
          <Button
            onClick={() => setExportOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all duration-200"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="card-premium border-border/30 bg-gradient-to-br from-emerald-500/6 to-emerald-500/2">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-emerald-400 mb-1" />
            <div className="text-2xl font-bold text-foreground/95">{reportData.totalLeads}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Leads</div>
          </CardContent>
        </Card>
        <Card className="card-premium border-border/30 bg-gradient-to-br from-amber-500/6 to-amber-500/2">
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto text-amber-400 mb-1" />
            <div className="text-2xl font-bold text-foreground/95">{reportData.qualifiedLeads}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Qualified</div>
          </CardContent>
        </Card>
        <Card className="card-premium border-border/30 bg-gradient-to-br from-cyan-500/6 to-cyan-500/2">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-cyan-400 mb-1" />
            <div className="text-2xl font-bold text-foreground/95">{reportData.avgScore}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Score</div>
          </CardContent>
        </Card>
        <Card className="card-premium border-border/30 bg-gradient-to-br from-violet-500/6 to-violet-500/2">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-violet-400 mb-1" />
            <div className="text-2xl font-bold text-foreground/95">{reportData.totalCampaigns}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Campaigns</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Report Summary */}
      <Card className="card-premium border-emerald-500/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
        <CardHeader className="pb-3 relative">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
            <FileText className="h-4 w-4 text-emerald-400" />
            AI Report Summary
            {aiSummary && (
              <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5 ml-2">
                <Zap className="h-2.5 w-2.5 mr-1" />
                AI Generated
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {aiSummaryLoading || aiIsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-secondary/30" />
              <Skeleton className="h-4 w-5/6 bg-secondary/30" />
              <Skeleton className="h-4 w-4/5 bg-secondary/30" />
              <Skeleton className="h-4 w-3/5 bg-secondary/30" />
              <Skeleton className="h-4 w-4/6 bg-secondary/30" />
            </div>
          ) : aiSummary ? (
            <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-4 text-sm text-foreground/80 leading-relaxed">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="whitespace-pre-wrap">{aiSummary}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-8 w-8 mx-auto text-emerald-400/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Generate an AI-powered executive summary of your report data
              </p>
              <Button
                onClick={generateAISummary}
                variant="outline"
                className="gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400"
              >
                <Sparkles className="h-4 w-4" />
                Generate Executive Summary
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Structured AI Report (multi-section) */}
      <Card className="card-premium border-violet-500/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
        <CardHeader className="pb-3 relative">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <Sparkles className="h-4 w-4 text-violet-400" />
              Full AI Report (Structured)
              <Badge variant="outline" className="text-[9px] border-violet-500/20 text-violet-400 bg-violet-500/5">
                glm-4.6v-flash
              </Badge>
            </CardTitle>
            <div className="flex gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateFullAIReport('pipeline_snapshot')}
                disabled={aiReportLoading}
                className="h-7 text-[10px] gap-1.5 border-violet-500/20 text-violet-400 hover:bg-violet-500/10"
              >
                {aiReportLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Pipeline Snapshot
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateFullAIReport('market_analysis')}
                disabled={aiReportLoading}
                className="h-7 text-[10px] gap-1.5 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
              >
                Market Analysis
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {aiReportError ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
              {aiReportError}
            </div>
          ) : aiReportLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-1/2 bg-secondary/30" />
              <Skeleton className="h-20 w-full bg-secondary/30" />
              <Skeleton className="h-20 w-full bg-secondary/30" />
              <Skeleton className="h-20 w-full bg-secondary/30" />
            </div>
          ) : aiReport ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                <div className="text-[10px] uppercase tracking-wider text-violet-400 mb-1">{aiReport.type.replace(/_/g, ' ')}</div>
                <h3 className="text-base font-semibold text-foreground/90">{aiReport.title}</h3>
              </div>

              {aiReport.sections.map((section, i) => (
                <div key={i} className="rounded-lg border border-border/30 bg-secondary/10 p-3">
                  <h4 className="text-sm font-semibold text-foreground/90 mb-1.5">{section.title}</h4>
                  <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                </div>
              ))}

              {aiReport.keyFindings.length > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <h4 className="text-sm font-semibold text-amber-400 mb-2">Key Findings</h4>
                  <ul className="space-y-1">
                    {aiReport.keyFindings.map((f, i) => (
                      <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                        <span className="text-amber-400">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiReport.recommendations.length > 0 && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <h4 className="text-sm font-semibold text-emerald-400 mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {aiReport.recommendations.map((r, i) => (
                      <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                        <span className="text-emerald-400">→</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-8 w-8 mx-auto text-violet-400/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Generate a full multi-section AI report — saved automatically to your reports library.
              </p>
              <Button
                onClick={() => generateFullAIReport('pipeline_snapshot')}
                variant="outline"
                className="gap-2 border-violet-500/20 text-violet-400 hover:bg-violet-500/10 hover:text-violet-400"
              >
                <Sparkles className="h-4 w-4" />
                Generate Pipeline Snapshot Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="card-premium border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/90">Lead Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Hot', count: reportData.hotLeads, color: 'bg-red-400', pct: Math.round((reportData.hotLeads / Math.max(reportData.totalLeads, 1)) * 100) },
                { label: 'Warm', count: reportData.warmLeads, color: 'bg-amber-400', pct: Math.round((reportData.warmLeads / Math.max(reportData.totalLeads, 1)) * 100) },
                { label: 'Cold', count: reportData.coldLeads, color: 'bg-cyan-400', pct: Math.round((reportData.coldLeads / Math.max(reportData.totalLeads, 1)) * 100) },
              ].map((tier) => (
                <div key={tier.label} className="flex items-center gap-3">
                  <span className="text-sm w-16 text-muted-foreground">{tier.label}</span>
                  <div className="flex-1 h-5 rounded-full bg-secondary/30 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tier.color} transition-all duration-700`}
                      style={{ width: `${Math.max(tier.pct, 2)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground/80 w-20 text-right">
                    {tier.count} ({tier.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Industry */}
        <Card className="card-premium border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/90">Leads by Industry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(reportData.leadsByIndustry)
                .sort(([, a], [, b]) => b - a)
                .map(([industry, count]) => (
                  <div key={industry} className="flex items-center justify-between">
                    <span className="text-sm text-foreground/80">{industry}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-secondary/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${(count / Math.max(reportData.totalLeads, 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground/80 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Country */}
      <Card className="card-premium border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground/90">Leads by Country</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(reportData.leadsByCountry)
              .sort(([, a], [, b]) => b - a)
              .map(([country, count]) => (
                <div key={country} className="rounded-lg border border-border/25 bg-secondary/15 p-3 text-center transition-colors hover:bg-secondary/25">
                  <div className="text-xl font-bold text-foreground/90">{count}</div>
                  <div className="text-xs text-muted-foreground">{country}</div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              Export Data
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {[
              { value: 'full', label: 'Full Prospect List', desc: 'All leads with complete contact and firmographic data', icon: Users },
              { value: 'campaign', label: 'Campaign Summary', desc: 'Campaign performance metrics and statistics', icon: Target },
              { value: 'scores', label: 'Lead Score Report', desc: 'Score breakdown for all qualified leads', icon: BarChart3 },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.value}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-200 ${
                    exportType === option.value
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-border/30 hover:bg-secondary/20 hover:border-border/50'
                  }`}
                  onClick={() => setExportType(option.value)}
                >
                  <div className={`rounded-lg p-2 transition-colors ${
                    exportType === option.value
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-secondary/30 text-muted-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground/90">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                  </div>
                  {exportType === option.value && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 ml-auto" />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)} className="border-border/40">
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all"
            >
              {exporting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
