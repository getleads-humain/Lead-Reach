'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Search,
  Plus,
  MapPin,
  Users,
  TrendingUp,
  ArrowUpRight,
  Globe,
  Sparkles,
  LayoutGrid,
  List,
  Database,
  Award,
  Star,
  ExternalLink,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { safeFetchJSON } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

interface CompanyLead {
  id: string;
  companyName: string;
  industry: string | null;
  city: string | null;
  country: string | null;
  employeeCount: string | null;
  leadScore: number;
  leadTier: string;
  stage: string;
  website: string | null;
  revenueEstimate: string | null;
  dataCompleteness: number;
  keyContactName: string | null;
  keyContactEmail: string | null;
  dataSource: string | null;
}

export function CompaniesView() {
  const { dataVersion } = useAppStore();
  const [companies, setCompanies] = useState<CompanyLead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All Industries');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadCompanies = useCallback(async () => {
    try {
      const data = await safeFetchJSON<{ leads: CompanyLead[]; total: number }>(
        '/api/leads?leadType=company&limit=500'
      );
      setCompanies(data.leads || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  }, [dataVersion]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Derive industries from real data
  const industryOptions = ['All Industries', ...Array.from(new Set(companies.map(c => c.industry).filter(Boolean) as string[]))];

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = !searchQuery ||
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.industry?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.city?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesIndustry = industryFilter === 'All Industries' || c.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  // Real stats from data
  const enrichedCount = companies.filter(c => c.stage !== 'new').length;
  const highValueCount = companies.filter(c => c.leadScore >= 80).length;
  const newThisMonthCount = companies.filter(c => c.stage === 'new').length;

  const stats = [
    { title: 'Total Companies', value: total.toLocaleString(), change: `${companies.length} loaded`, icon: Building2, accent: 'emerald' },
    { title: 'Enriched', value: enrichedCount.toLocaleString(), change: total > 0 ? `${Math.round((enrichedCount / total) * 100)}% coverage` : 'No data', icon: Database, accent: 'cyan' },
    { title: 'High Value', value: highValueCount.toString(), change: 'Score 80+', icon: Award, accent: 'amber' },
    { title: 'New Leads', value: newThisMonthCount.toString(), change: 'Stage: New', icon: TrendingUp, accent: 'violet' },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-secondary/30" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl bg-secondary/30" />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="card-premium border-border/40 max-w-lg w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Building2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">No Companies Yet</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Launch a campaign to discover company leads. Your AI agents will research and find
              companies matching your target criteria automatically.
            </p>
            <Button
              onClick={() => useAppStore.getState().setActiveView('campaigns')}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              size="lg"
            >
              <Sparkles className="h-4 w-4" />
              Launch a Campaign
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="card-premium border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={cn('h-4 w-4', `text-${stat.accent}-400`)} />
                  <Badge variant="outline" className="text-[9px] border-border/20 text-muted-foreground/50">
                    <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground/50 mt-0.5">{stat.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Card className="card-premium border-border/30 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary/20 border-border/30 focus:border-emerald-500/30"
              />
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="h-8 w-40 text-xs bg-secondary/20 border-border/30">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/60">
                {industryOptions.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" className={cn('h-8 w-8 p-0', viewMode === 'grid' ? 'bg-secondary/30 text-foreground' : 'text-muted-foreground')} onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className={cn('h-8 w-8 p-0', viewMode === 'list' ? 'bg-secondary/30 text-foreground' : 'text-muted-foreground')} onClick={() => setViewMode('list')}>
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[550px]">
          {filteredCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Inbox className="h-10 w-10 text-muted-foreground/20" />
              <p className="mt-3 text-sm text-muted-foreground">No companies match your search</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="rounded-xl border border-border/20 bg-secondary/5 hover:bg-secondary/15 hover:border-emerald-500/20 transition-all duration-200 p-4 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold shrink-0',
                        company.leadScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                        company.leadScore >= 60 ? 'bg-amber-500/10 text-amber-400' :
                        'bg-secondary/30 text-muted-foreground'
                      )}>
                        {company.companyName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground/90 truncate flex items-center gap-1.5">
                          {company.companyName}
                          {company.stage !== 'new' && <Database className="h-3 w-3 text-cyan-400" />}
                        </div>
                        <div className="text-[11px] text-muted-foreground/50">{company.industry || 'Unknown Industry'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-10 rounded-full bg-secondary/40 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            company.leadScore >= 80 ? 'bg-emerald-400' : company.leadScore >= 60 ? 'bg-amber-400' : 'bg-red-400'
                          )}
                          style={{ width: `${company.leadScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-foreground/60">{company.leadScore}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {[company.city, company.country].filter(Boolean).join(', ') || 'Unknown location'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
                      <Users className="h-3 w-3 shrink-0" />
                      {company.employeeCount || 'Unknown size'} employees
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
                      <Globe className="h-3 w-3 shrink-0" />
                      {company.website || 'No website'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/10">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] bg-secondary/20 text-muted-foreground border-border/20">
                        {company.revenueEstimate || 'N/A'}
                      </Badge>
                      <Badge variant="outline" className={cn('text-[9px] border-border/20', 
                        company.leadTier === 'hot' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        company.leadTier === 'warm' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        company.leadTier === 'cold' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-secondary/20 text-muted-foreground border-border/20'
                      )}>
                        {company.leadTier}
                      </Badge>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {filteredCompanies.map((company) => (
                <div key={company.id} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/15 transition-colors cursor-pointer">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold shrink-0',
                    company.leadScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-secondary/30 text-muted-foreground'
                  )}>
                    {company.companyName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground/90">{company.companyName}</div>
                    <div className="text-[11px] text-muted-foreground/50">{company.industry || 'Unknown'} · {[company.city, company.country].filter(Boolean).join(', ') || 'Unknown'}</div>
                  </div>
                  <Badge variant="outline" className="text-[9px] bg-secondary/20 text-muted-foreground border-border/20">{company.employeeCount || '?'}</Badge>
                  <Badge variant="outline" className="text-[9px] bg-secondary/20 text-muted-foreground border-border/20">{company.revenueEstimate || 'N/A'}</Badge>
                  <div className="flex items-center gap-1.5 w-20">
                    <div className="h-1.5 w-10 rounded-full bg-secondary/40 overflow-hidden">
                      <div className={cn('h-full rounded-full', company.leadScore >= 80 ? 'bg-emerald-400' : 'bg-amber-400')} style={{ width: `${company.leadScore}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-foreground/70">{company.leadScore}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}
