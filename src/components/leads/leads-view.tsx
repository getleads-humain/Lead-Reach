'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreVertical,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Building2,
  MapPin,
  Users,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { LeadTier, LeadStage } from '@/lib/types';
import { TIER_COLORS, STAGE_LABELS, STAGE_COLORS } from '@/lib/types';

interface Lead {
  id: string;
  companyName: string;
  industry: string | null;
  city: string | null;
  country: string | null;
  phoneMain: string | null;
  generalEmail: string | null;
  website: string | null;
  employeeCount: string | null;
  revenueEstimate: string | null;
  leadScore: number;
  leadTier: string;
  stage: string;
  keyContactName: string | null;
  keyContactTitle: string | null;
  keyContactEmail: string | null;
  ceoName: string | null;
  ceoEmail: string | null;
  linkedinUrl: string | null;
  techStack: string | null;
  foundingYear: string | null;
  ownershipType: string | null;
  subIndustry: string | null;
  hqAddress: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  notes: string | null;
  campaignId: string;
  campaign: { name: string };
  firmographicScore: number;
  intentScore: number;
  reachabilityScore: number;
  strategicScore: number;
  dataCompleteness: number;
  discoveredAt: string;
  enrichedAt: string | null;
  qualifiedAt: string | null;
  contactedAt: string | null;
}

type SortField = 'companyName' | 'leadScore' | 'leadTier' | 'stage' | 'employeeCount' | 'industry';
type SortDir = 'asc' | 'desc';

interface CampaignOption {
  id: string;
  name: string;
}

export function LeadsView() {
  const { selectedCampaignId, setSelectedCampaignId } = useAppStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>(selectedCampaignId || 'all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sortField, setSortField] = useState<SortField>('leadScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const limit = 25;

  useEffect(() => {
    if (selectedCampaignId) {
      setCampaignFilter(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    fetch('/api/campaigns')
      .then((r) => r.json())
      .then((data) => setCampaigns(data.map((c: CampaignOption) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (tierFilter !== 'all') params.set('tier', tierFilter);
      if (stageFilter !== 'all') params.set('stage', stageFilter);
      if (campaignFilter !== 'all') params.set('campaignId', campaignFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  }, [page, tierFilter, stageFilter, campaignFilter, search]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    let aVal: string | number = a[sortField] as string | number;
    let bVal: string | number = b[sortField] as string | number;
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleDeleteLead = async (id: string) => {
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setSelectedLead(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleStageChange = async (id: string, stage: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      const updated = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
      if (selectedLead?.id === id) {
        setSelectedLead({ ...selectedLead, ...updated });
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Leads</h2>
          <p className="text-sm text-muted-foreground">
            {total} leads discovered across all campaigns
          </p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies, contacts, locations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-secondary/30 border-border/40 focus:border-emerald-500/30"
          />
        </div>
        <div className="flex gap-2">
          <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}>
            <SelectTrigger className="w-32 bg-secondary/30 border-border/40">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/60">
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
              <SelectItem value="unqualified">Unqualified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={(v) => { setStageFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 bg-secondary/30 border-border/40">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/60">
              <SelectItem value="all">All Stages</SelectItem>
              {Object.entries(STAGE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={campaignFilter} onValueChange={(v) => { setCampaignFilter(v); setPage(1); setSelectedCampaignId(v === 'all' ? null : v); }}>
            <SelectTrigger className="w-48 bg-secondary/30 border-border/40">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/60">
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg bg-secondary/30" />
          ))}
        </div>
      ) : sortedLeads.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-medium text-foreground/80">No leads found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/30 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="cursor-pointer text-muted-foreground text-xs uppercase tracking-wider" onClick={() => handleSort('companyName')}>
                    <span className="flex items-center gap-1">Company <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Industry</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Location</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Contact</TableHead>
                  <TableHead className="cursor-pointer text-muted-foreground text-xs uppercase tracking-wider" onClick={() => handleSort('leadScore')}>
                    <span className="flex items-center gap-1">Score <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Tier</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Stage</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-secondary/20 border-border/20 transition-colors"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-bold shrink-0">
                          {lead.companyName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-foreground/90 truncate max-w-40">{lead.companyName}</div>
                          {lead.website && (
                            <div className="text-xs text-muted-foreground truncate max-w-40">{lead.website.replace('https://', '')}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{lead.industry || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lead.city && lead.country ? `${lead.city}, ${lead.country}` : lead.country || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lead.keyContactName || lead.ceoName || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-12 rounded-full bg-secondary/50 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              lead.leadScore >= 80 ? 'bg-emerald-400' :
                              lead.leadScore >= 60 ? 'bg-amber-400' :
                              'bg-red-400'
                            }`}
                            style={{ width: `${lead.leadScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground/80">{lead.leadScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${TIER_COLORS[lead.leadTier as LeadTier] || ''}`}>
                        {lead.leadTier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${STAGE_COLORS[lead.stage as LeadStage] || ''}`}>
                        {STAGE_LABELS[lead.stage as LeadStage] || lead.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border/60">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}>
                            <ExternalLink className="h-3.5 w-3.5 mr-2" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/20 bg-secondary/10">
            <div className="text-xs text-muted-foreground">
              Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-border/30 text-muted-foreground"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-foreground/80 font-medium">{page} / {totalPages || 1}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-border/30 text-muted-foreground"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto bg-card border-border/40">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 text-lg font-bold">
                    {selectedLead.companyName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-lg text-foreground">{selectedLead.companyName}</div>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="outline" className={`text-[10px] ${TIER_COLORS[selectedLead.leadTier as LeadTier] || ''}`}>
                        {selectedLead.leadTier}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${STAGE_COLORS[selectedLead.stage as LeadStage] || ''}`}>
                        {STAGE_LABELS[selectedLead.stage as LeadStage] || selectedLead.stage}
                      </Badge>
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Score Breakdown */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-foreground/90">Lead Score: {selectedLead.leadScore}/100</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Firmographic', value: selectedLead.firmographicScore },
                      { label: 'Intent', value: selectedLead.intentScore },
                      { label: 'Reachability', value: selectedLead.reachabilityScore },
                      { label: 'Strategic', value: selectedLead.strategicScore },
                      { label: 'Data Quality', value: selectedLead.dataCompleteness },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-24">{item.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground/80 w-8">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Company Info */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground/90">
                    <Building2 className="h-4 w-4 text-muted-foreground" /> Company
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    {selectedLead.industry && <div><span className="text-muted-foreground">Industry:</span> <span className="text-foreground/80">{selectedLead.industry}</span>{selectedLead.subIndustry ? ` / ${selectedLead.subIndustry}` : ''}</div>}
                    {selectedLead.employeeCount && <div><span className="text-muted-foreground">Employees:</span> <span className="text-foreground/80">{selectedLead.employeeCount}</span></div>}
                    {selectedLead.revenueEstimate && <div><span className="text-muted-foreground">Revenue:</span> <span className="text-foreground/80">{selectedLead.revenueEstimate}</span></div>}
                    {selectedLead.foundingYear && <div><span className="text-muted-foreground">Founded:</span> <span className="text-foreground/80">{selectedLead.foundingYear}</span></div>}
                    {selectedLead.ownershipType && <div><span className="text-muted-foreground">Ownership:</span> <span className="text-foreground/80">{selectedLead.ownershipType}</span></div>}
                  </div>
                </div>

                {/* Location */}
                {(selectedLead.city || selectedLead.hqAddress) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground/90">
                      <MapPin className="h-4 w-4 text-muted-foreground" /> Location
                    </h4>
                    <div className="space-y-1.5 text-sm text-foreground/80">
                      {selectedLead.hqAddress && <div>{selectedLead.hqAddress}</div>}
                      {selectedLead.city && <div>{selectedLead.city}{selectedLead.stateProvince ? `, ${selectedLead.stateProvince}` : ''}{selectedLead.country ? `, ${selectedLead.country}` : ''}</div>}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground/90">
                    <Users className="h-4 w-4 text-muted-foreground" /> Key Contacts
                  </h4>
                  <div className="space-y-2">
                    {selectedLead.ceoName && (
                      <div className="rounded-lg border border-border/30 bg-secondary/15 p-2.5">
                        <div className="font-medium text-sm text-foreground/90">{selectedLead.ceoName}</div>
                        <div className="text-xs text-muted-foreground">CEO{selectedLead.ceoEmail ? ` • ${selectedLead.ceoEmail}` : ''}</div>
                      </div>
                    )}
                    {selectedLead.keyContactName && (
                      <div className="rounded-lg border border-border/30 bg-secondary/15 p-2.5">
                        <div className="font-medium text-sm text-foreground/90">{selectedLead.keyContactName}</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedLead.keyContactTitle || 'Key Contact'}
                          {selectedLead.keyContactEmail ? ` • ${selectedLead.keyContactEmail}` : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Channels */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-foreground/90">Contact Channels</h4>
                  <div className="space-y-1.5 text-sm">
                    {selectedLead.phoneMain && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {selectedLead.phoneMain}
                      </div>
                    )}
                    {selectedLead.generalEmail && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {selectedLead.generalEmail}
                      </div>
                    )}
                    {selectedLead.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                          {selectedLead.website.replace('https://', '')}
                        </a>
                      </div>
                    )}
                    {selectedLead.linkedinUrl && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-cyan-400">in</span>
                        <a href={selectedLead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-xs transition-colors">
                          LinkedIn
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stage Update */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-foreground/90">Update Stage</h4>
                  <Select
                    value={selectedLead.stage}
                    onValueChange={(v) => handleStageChange(selectedLead.id, v)}
                  >
                    <SelectTrigger className="bg-secondary/30 border-border/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border/60">
                      {Object.entries(STAGE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Discovered: {new Date(selectedLead.discoveredAt).toLocaleDateString()}</div>
                  {selectedLead.enrichedAt && <div>Enriched: {new Date(selectedLead.enrichedAt).toLocaleDateString()}</div>}
                  {selectedLead.qualifiedAt && <div>Qualified: {new Date(selectedLead.qualifiedAt).toLocaleDateString()}</div>}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
