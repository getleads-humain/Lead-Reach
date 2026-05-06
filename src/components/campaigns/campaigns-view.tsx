'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Target,
  TrendingUp,
  MoreVertical,
  Play,
  Pause,
  Archive,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/lib/store';
import type { CampaignWithCounts, CampaignStatus } from '@/lib/types';
import { INDUSTRIES, LOCATIONS, COMPANY_SIZES } from '@/lib/types';

export function CampaignsView() {
  const { setActiveView, setSelectedCampaignId } = useAppStore();
  const [campaigns, setCampaigns] = useState<CampaignWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<CampaignWithCounts | null>(null);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formCreating, setFormCreating] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setFormCreating(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          targetIndustry: formIndustry,
          targetLocation: formLocation,
          targetCompanySize: formSize,
        }),
      });
      const newCampaign = await res.json();
      setCampaigns((prev) => [newCampaign, ...prev]);
      setCreateOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setFormCreating(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormIndustry('');
    setFormLocation('');
    setFormSize('');
  };

  const handleStatusChange = async (id: string, status: CampaignStatus) => {
    try {
      await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.targetIndustry || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.targetLocation || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5',
      paused: 'border-amber-500/20 text-amber-400 bg-amber-500/5',
      completed: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5',
      archived: 'border-gray-500/20 text-gray-500 bg-gray-500/5',
    };
    return styles[status] || styles.active;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48 bg-secondary/30" />
          <Skeleton className="h-10 w-32 bg-secondary/30" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl bg-secondary/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campaigns</h2>
          <p className="text-sm text-muted-foreground">
            Manage your lead generation campaigns
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search campaigns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary/30 border-border/40 focus:border-emerald-500/30"
        />
      </div>

      {/* Campaign Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-16">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-medium text-foreground/80">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first campaign to start generating leads
          </p>
          <Button
            className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="card-premium border-border/30 cursor-pointer group"
              onClick={() => setDetailCampaign(campaign)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate text-foreground/90">
                      {campaign.name}
                    </h3>
                    {campaign.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border/60">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCampaignId(campaign.id);
                          setActiveView('leads');
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-2" />
                        View Leads
                      </DropdownMenuItem>
                      {campaign.status === 'active' && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(campaign.id, 'paused');
                          }}
                        >
                          <Pause className="h-3.5 w-3.5 mr-2" />
                          Pause
                        </DropdownMenuItem>
                      )}
                      {campaign.status === 'paused' && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(campaign.id, 'active');
                          }}
                        >
                          <Play className="h-3.5 w-3.5 mr-2" />
                          Resume
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(campaign.id, 'archived');
                        }}
                      >
                        <Archive className="h-3.5 w-3.5 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge variant="outline" className={`text-[10px] ${statusBadge(campaign.status)}`}>
                    {campaign.status}
                  </Badge>
                  {campaign.targetIndustry && (
                    <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
                      {campaign.targetIndustry}
                    </Badge>
                  )}
                  {campaign.targetLocation && (
                    <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
                      {campaign.targetLocation}
                    </Badge>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Qualification Progress</span>
                    <span className="font-semibold text-foreground/80">
                      {campaign.leadsFound > 0
                        ? Math.round(
                            (campaign.leadsQualified / campaign.leadsFound) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      campaign.leadsFound > 0
                        ? Math.round(
                            (campaign.leadsQualified / campaign.leadsFound) * 100
                          )
                        : 0
                    }
                    className="h-1.5 bg-secondary/40"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="rounded-md bg-secondary/20 p-2">
                    <div className="text-sm font-bold text-foreground/90">
                      {campaign.leadsFound}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Found</div>
                  </div>
                  <div className="rounded-md bg-secondary/20 p-2">
                    <div className="text-sm font-bold text-foreground/90">
                      {campaign.leadsQualified}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Qualified</div>
                  </div>
                  <div className="rounded-md bg-secondary/20 p-2">
                    <div className="text-sm font-bold text-foreground/90">
                      {campaign.leadsContacted}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Contacted</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground/80">Campaign Name *</Label>
              <Input
                placeholder="e.g., Accounting Firms in Dubai"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-secondary/30 border-border/40 focus:border-emerald-500/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Description</Label>
              <Textarea
                placeholder="Describe the target audience and goals..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
                className="bg-secondary/30 border-border/40 focus:border-emerald-500/30 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-foreground/80">Target Industry</Label>
                <Select value={formIndustry} onValueChange={setFormIndustry}>
                  <SelectTrigger className="bg-secondary/30 border-border/40">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/60">
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/80">Target Location</Label>
                <Select value={formLocation} onValueChange={setFormLocation}>
                  <SelectTrigger className="bg-secondary/30 border-border/40">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/60">
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Company Size</Label>
              <Select value={formSize} onValueChange={setFormSize}>
                <SelectTrigger className="bg-secondary/30 border-border/40">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/60">
                  {COMPANY_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} employees
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-border/40">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formName.trim() || formCreating}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all"
            >
              {formCreating ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Detail Dialog */}
      <Dialog open={!!detailCampaign} onOpenChange={() => setDetailCampaign(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border/60">
          {detailCampaign && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">{detailCampaign.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {detailCampaign.description && (
                  <p className="text-sm text-muted-foreground">
                    {detailCampaign.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={statusBadge(detailCampaign.status)}>
                    {detailCampaign.status}
                  </Badge>
                  {detailCampaign.targetIndustry && (
                    <Badge variant="outline" className="border-border/30 text-muted-foreground">{detailCampaign.targetIndustry}</Badge>
                  )}
                  {detailCampaign.targetLocation && (
                    <Badge variant="outline" className="border-border/30 text-muted-foreground">{detailCampaign.targetLocation}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { value: detailCampaign.leadsFound, label: 'Found' },
                    { value: detailCampaign.leadsQualified, label: 'Qualified' },
                    { value: detailCampaign.leadsContacted, label: 'Contacted' },
                    { value: detailCampaign.leadsResponded, label: 'Responded' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-secondary/20 p-3">
                      <div className="text-xl font-bold text-foreground/90">{item.value}</div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Created {new Date(detailCampaign.createdAt).toLocaleDateString()} • Last updated{' '}
                  {new Date(detailCampaign.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCampaignId(detailCampaign.id);
                    setActiveView('leads');
                    setDetailCampaign(null);
                  }}
                  className="border-border/40"
                >
                  View Leads
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
