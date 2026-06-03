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
  User,
  Users,
  Search,
  Plus,
  Filter,
  Mail,
  Phone,
  Building2,
  MapPin,
  Award,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  ListTodo,
  Sparkles,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { safeFetchJSON } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { STAGE_LABELS, type LeadStage } from '@/lib/types';

interface PersonLead {
  id: string;
  name: string;
  jobTitle: string | null;
  currentCompany: string | null;
  personEmail: string | null;
  personPhone: string | null;
  leadScore: number;
  leadTier: string;
  stage: string;
  city: string | null;
  country: string | null;
  personLinkedin: string | null;
  keyContactName: string | null;
  keyContactTitle: string | null;
  keyContactEmail: string | null;
  companyName: string | null;
}

const statusStyles: Record<string, string> = {
  new: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  enriched: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  qualified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  contacted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  engaged: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  negotiating: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  closed_won: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed_lost: 'bg-red-500/10 text-red-400 border-red-500/20',
  nurture: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export function PeopleView() {
  const { dataVersion } = useAppStore();
  const [people, setPeople] = useState<PersonLead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadPeople = useCallback(async () => {
    try {
      const data = await safeFetchJSON<{ leads: PersonLead[]; total: number }>(
        '/api/leads?leadType=person&limit=500'
      );
      setPeople(data.leads || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error loading people:', error);
    } finally {
      setLoading(false);
    }
  }, [dataVersion]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  // If no person-type leads exist, also pull company leads that have key contacts
  const [fallbackCompanies, setFallbackCompanies] = useState<PersonLead[]>([]);
  useEffect(() => {
    if (people.length === 0 && !loading) {
      safeFetchJSON<{ leads: PersonLead[]; total: number }>('/api/leads?limit=500')
        .then(data => {
          setFallbackCompanies(
            (data.leads || []).filter(l => l.keyContactName) as PersonLead[]
          );
        })
        .catch(() => {});
    }
  }, [people.length, loading]);

  const displayPeople = people.length > 0 ? people : fallbackCompanies;
  const effectiveTotal = people.length > 0 ? total : fallbackCompanies.length;

  const filteredPeople = displayPeople.filter((p) => {
    const name = p.keyContactName || p.name || '';
    const company = p.currentCompany || p.companyName || '';
    const title = p.keyContactTitle || p.jobTitle || '';
    const matchesSearch = !searchQuery ||
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.stage === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Real stats
  const contactedCount = displayPeople.filter(p => ['contacted', 'engaged', 'negotiating', 'closed_won'].includes(p.stage)).length;
  const qualifiedCount = displayPeople.filter(p => ['qualified', 'contacted', 'engaged', 'negotiating', 'closed_won'].includes(p.stage)).length;
  const newCount = displayPeople.filter(p => p.stage === 'new').length;

  const stats = [
    { title: 'Total People', value: effectiveTotal.toLocaleString(), change: `${displayPeople.length} loaded`, icon: Users, accent: 'emerald' },
    { title: 'New Leads', value: newCount.toString(), change: 'Stage: New', icon: UserPlus, accent: 'cyan' },
    { title: 'Contacted', value: contactedCount.toString(), change: effectiveTotal > 0 ? `${Math.round((contactedCount / effectiveTotal) * 100)}% of total` : 'No data', icon: Phone, accent: 'violet' },
    { title: 'Qualified', value: qualifiedCount.toString(), change: effectiveTotal > 0 ? `${Math.round((qualifiedCount / effectiveTotal) * 100)}% rate` : 'No data', icon: Award, accent: 'amber' },
  ];

  const stageOptions = Array.from(new Set(displayPeople.map(p => p.stage)));

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

  if (displayPeople.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="card-premium border-border/40 max-w-lg w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Users className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">No People Yet</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Launch a campaign to discover contact leads. Your AI agents will research
              and find key contacts matching your target criteria automatically.
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
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary/20 border-border/30 focus:border-emerald-500/30"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs bg-secondary/20 border-border/30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/60">
                <SelectItem value="all">All Status</SelectItem>
                {stageOptions.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {STAGE_LABELS[stage as LeadStage] || stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="max-h-[500px]">
          {filteredPeople.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Inbox className="h-10 w-10 text-muted-foreground/20" />
              <p className="mt-3 text-sm text-muted-foreground">No people match your search</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Title</div>
                <div className="col-span-2">Company</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Score</div>
                <div className="col-span-1"></div>
              </div>

              {filteredPeople.map((person) => {
                const name = person.keyContactName || person.name || 'Unknown';
                const title = person.keyContactTitle || person.jobTitle || '—';
                const company = person.currentCompany || person.companyName || '—';
                const email = person.keyContactEmail || person.personEmail;
                const phone = person.personPhone;
                const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
                const location = [person.city, person.country].filter(Boolean).join(', ');

                return (
                  <div
                    key={person.id}
                    className="grid grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-secondary/15 transition-colors cursor-pointer group"
                  >
                    <div className="col-span-3 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400 shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground/90 truncate">{name}</div>
                        {location && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                            <MapPin className="h-2.5 w-2.5" />
                            {location}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground/70 truncate">{title}</div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      <span className="text-xs text-foreground/80 truncate">{company}</span>
                    </div>
                    <div className="col-span-2 space-y-0.5">
                      {email && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                          <Mail className="h-2.5 w-2.5" />
                          <span className="truncate">{email}</span>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                          <Phone className="h-2.5 w-2.5" />
                          <span className="truncate">{phone}</span>
                        </div>
                      )}
                      {!email && !phone && <span className="text-[10px] text-muted-foreground/30">No contact info</span>}
                    </div>
                    <div className="col-span-1">
                      <Badge variant="outline" className={cn('text-[9px]', statusStyles[person.stage] || 'bg-secondary/20 text-muted-foreground')}>
                        {STAGE_LABELS[person.stage as LeadStage] || person.stage}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-8 rounded-full bg-secondary/40 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              person.leadScore >= 80 ? 'bg-emerald-400' : person.leadScore >= 60 ? 'bg-amber-400' : 'bg-red-400'
                            )}
                            style={{ width: `${person.leadScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-foreground/70">{person.leadScore}</span>
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border/20 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/50">Showing {filteredPeople.length} of {displayPeople.length} people</span>
        </div>
      </Card>
    </div>
  );
}
