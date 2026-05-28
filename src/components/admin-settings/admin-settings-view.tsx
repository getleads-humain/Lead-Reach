'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Users,
  Link2,
  CreditCard,
  Code,
  Shield,
  Globe,
  Mail,
  Bell,
  Palette,
  Database,
  Key,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'api', label: 'API', icon: Code },
];

const integrations = [
  { name: 'Salesforce', status: 'connected', icon: Database, category: 'CRM' },
  { name: 'HubSpot', status: 'available', icon: Database, category: 'CRM' },
  { name: 'Slack', status: 'connected', icon: Bell, category: 'Communication' },
  { name: 'Gmail', status: 'connected', icon: Mail, category: 'Email' },
  { name: 'LinkedIn', status: 'available', icon: Globe, category: 'Social' },
  { name: 'Zapier', status: 'available', icon: Link2, category: 'Automation' },
];

const teamMembers = [
  { name: 'Alex Morgan', email: 'alex@leadreach.ai', role: 'Admin', status: 'active', avatar: 'AM' },
  { name: 'Sarah Lane', email: 'sarah@leadreach.ai', role: 'Member', status: 'active', avatar: 'SL' },
  { name: 'James Park', email: 'james@leadreach.ai', role: 'Member', status: 'invited', avatar: 'JP' },
];

export function AdminSettingsView() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-5">
      {/* Settings Layout */}
      <Card className="card-premium border-border/30 overflow-hidden">
        <div className="flex min-h-[600px]">
          {/* Settings Sidebar */}
          <div className="w-56 border-r border-border/20 p-3 space-y-1 shrink-0">
            <div className="px-3 py-2 mb-2">
              <h2 className="text-sm font-bold text-foreground/90 flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground/50" />
                Settings
              </h2>
            </div>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                      : 'text-muted-foreground/50 hover:text-foreground hover:bg-secondary/20'
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 text-left">{tab.label}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/20" />
                </button>
              );
            })}
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-sm font-semibold text-foreground/90 mb-1">General Settings</h3>
                  <p className="text-xs text-muted-foreground/50">Manage your workspace configuration and preferences</p>
                </div>

                <Separator className="bg-border/20" />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/70">Workspace Name</label>
                    <Input defaultValue="LeadReach AI" className="h-9 text-xs bg-secondary/20 border-border/30 focus:border-emerald-500/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/70">Primary Domain</label>
                    <Input defaultValue="leadreach.ai" className="h-9 text-xs bg-secondary/20 border-border/30 focus:border-emerald-500/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/70">Default Industry</label>
                    <Input defaultValue="Technology" className="h-9 text-xs bg-secondary/20 border-border/30 focus:border-emerald-500/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/70">Timezone</label>
                    <Input defaultValue="UTC-5 (Eastern)" className="h-9 text-xs bg-secondary/20 border-border/30 focus:border-emerald-500/30" />
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Save Changes
                  </Button>
                </div>

                <Separator className="bg-border/20" />

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-foreground/70">Notifications</h4>
                  {[
                    { label: 'Email notifications for new leads', enabled: true },
                    { label: 'Push notifications for pipeline changes', enabled: true },
                    { label: 'Weekly performance digest', enabled: false },
                    { label: 'Agent task completion alerts', enabled: true },
                  ].map((pref) => (
                    <div key={pref.label} className="flex items-center justify-between py-2">
                      <span className="text-xs text-foreground/60">{pref.label}</span>
                      <div className={cn(
                        'w-9 h-5 rounded-full cursor-pointer transition-colors relative',
                        pref.enabled ? 'bg-emerald-500' : 'bg-secondary/50'
                      )}>
                        <div className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
                          pref.enabled ? 'right-0.5' : 'left-0.5'
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground/90 mb-1">Team Management</h3>
                    <p className="text-xs text-muted-foreground/50">Invite and manage team members</p>
                  </div>
                  <Button size="sm" className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="h-3.5 w-3.5" />
                    Invite Member
                  </Button>
                </div>

                <Separator className="bg-border/20" />

                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.email} className="flex items-center gap-3 p-3 rounded-lg border border-border/15 hover:bg-secondary/5 transition-colors">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400 shrink-0">
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground/80">{member.name}</div>
                        <div className="text-[10px] text-muted-foreground/40">{member.email}</div>
                      </div>
                      <Badge variant="outline" className="text-[9px] bg-secondary/20 text-muted-foreground border-border/20">
                        {member.role}
                      </Badge>
                      {member.status === 'invited' && (
                        <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20 border">
                          Invited
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-sm font-semibold text-foreground/90 mb-1">Integrations</h3>
                  <p className="text-xs text-muted-foreground/50">Connect your tools and services</p>
                </div>

                <Separator className="bg-border/20" />

                <div className="space-y-3">
                  {integrations.map((integration) => {
                    const Icon = integration.icon;
                    const isConnected = integration.status === 'connected';
                    return (
                      <div key={integration.name} className="flex items-center gap-3 p-3 rounded-lg border border-border/15 hover:bg-secondary/5 transition-colors">
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
                          isConnected ? 'bg-emerald-500/10' : 'bg-secondary/20'
                        )}>
                          <Icon className={cn('h-4 w-4', isConnected ? 'text-emerald-400' : 'text-muted-foreground/40')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground/80">{integration.name}</div>
                          <div className="text-[10px] text-muted-foreground/40">{integration.category}</div>
                        </div>
                        {isConnected ? (
                          <div className="flex items-center gap-2">
                            <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                              Connected
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground">Configure</Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1">
                            <Link2 className="h-3 w-3" />
                            Connect
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-sm font-semibold text-foreground/90 mb-1">Billing & Subscription</h3>
                  <p className="text-xs text-muted-foreground/50">Manage your subscription and payment details</p>
                </div>

                <Separator className="bg-border/20" />

                <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground/90">Pro Plan</div>
                      <div className="text-[11px] text-muted-foreground/50">Billed annually · Renews Jan 2025</div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-[9px]">Active</Badge>
                  </div>
                  <div className="text-2xl font-bold text-foreground/90">$297<span className="text-sm font-normal text-muted-foreground/50">/month</span></div>
                  <div className="flex items-center gap-3 mt-3">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">Change Plan</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground">View Invoices</Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-foreground/70">Usage This Month</h4>
                  {[
                    { label: 'Leads Discovered', current: 2847, limit: 5000 },
                    { label: 'Emails Sent', current: 1247, limit: 5000 },
                    { label: 'API Calls', current: 15234, limit: 50000 },
                  ].map((usage) => (
                    <div key={usage.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-foreground/60">{usage.label}</span>
                        <span className="text-[10px] text-muted-foreground/40">{usage.current.toLocaleString()} / {usage.limit.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary/30 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            (usage.current / usage.limit) > 0.8 ? 'bg-amber-400' : 'bg-emerald-400'
                          )}
                          style={{ width: `${(usage.current / usage.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-sm font-semibold text-foreground/90 mb-1">API Access</h3>
                  <p className="text-xs text-muted-foreground/50">Manage API keys and documentation</p>
                </div>

                <Separator className="bg-border/20" />

                <div className="space-y-3">
                  <div className="rounded-lg border border-border/15 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-xs font-medium text-foreground/80">Production API Key</span>
                      </div>
                      <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border">Active</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] text-muted-foreground/50 bg-secondary/20 px-2 py-1 rounded flex-1 font-mono">
                        lr_prod_****************************7f3a
                      </code>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]">Copy</Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/15 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="text-xs font-medium text-foreground/80">Test API Key</span>
                      </div>
                      <Badge className="text-[9px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20 border">Test</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] text-muted-foreground/50 bg-secondary/20 px-2 py-1 rounded flex-1 font-mono">
                        lr_test_****************************2b9d
                      </code>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]">Copy</Button>
                    </div>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Generate New Key
                </Button>

                <div className="pt-3">
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-emerald-400 hover:text-emerald-300">
                    <ExternalLink className="h-3.5 w-3.5" />
                    API Documentation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
