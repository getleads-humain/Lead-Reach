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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Download,
  FileSpreadsheet,
  BarChart3,
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

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

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const [campaignsRes, leadsRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/leads?limit=1000'),
      ]);
      const campaigns = await campaignsRes.json();
      const leadsData = await leadsRes.json();
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const leadsRes = await fetch('/api/leads?limit=1000');
      const leadsData = await leadsRes.json();
      const leads = leadsData.leads || [];

      let csv = '';
      if (exportType === 'full') {
        csv = 'Company,Industry,Location,Phone,Email,Website,Employees,Revenue,Score,Tier,Stage,Key Contact\n';
        for (const lead of leads) {
          csv += `"${lead.companyName}","${lead.industry || ''}","${lead.city || ''}, ${lead.country || ''}","${lead.phoneMain || ''}","${lead.generalEmail || ''}","${lead.website || ''}","${lead.employeeCount || ''}","${lead.revenueEstimate || ''}",${lead.leadScore},"${lead.leadTier}","${lead.stage}","${lead.keyContactName || ''}"\n`;
        }
      } else if (exportType === 'campaign') {
        const campaignsRes = await fetch('/api/campaigns');
        const campaigns = await campaignsRes.json();
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
        <Button
          onClick={() => setExportOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all duration-200"
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
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
