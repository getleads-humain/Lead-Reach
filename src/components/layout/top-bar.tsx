'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Sparkles,
  Send,
  Fingerprint,
  LogOut,
  Settings,
  User,
  Crown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { safeFetchJSON } from '@/lib/utils';
import Link from 'next/link';

export function TopBar() {
  const { notifications, userProfile, setActiveView } = useAppStore();
  const { user, profile, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Use auth profile name, fallback to userProfile from store, fallback to email
  const displayName = profile?.full_name || userProfile.fullName || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const planTier = profile?.plan_tier || 'scout';

  const handleAiSubmit = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    try {
      const data = await safeFetchJSON<{ response?: string; plan?: { campaignName?: string; targetIndustry?: string; targetLocation?: string }; agentTasks?: Array<Record<string, unknown>>; campaignId?: string }>('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: aiQuery }),
      });
      setAiResponse(data.response || 'No response');

      if (data.plan) {
        if (data.plan.campaignName) {
          const campaign = await safeFetchJSON<{ id: string; name: string }>('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.plan.campaignName,
              targetIndustry: data.plan.targetIndustry,
              targetLocation: data.plan.targetLocation,
            }),
          });
        }
      }
    } catch (error) {
      console.error('AI query error:', error);
      setAiResponse('Sorry, there was an error processing your request.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 glass px-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Agentic Lead Generation
          </h2>
          {user && (
            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0">
              {planTier.toUpperCase()}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-all duration-200"
            onClick={() => setSearchOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Ask AI</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="group relative gap-2 border-violet-500/20 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 hover:border-violet-500/40 transition-all duration-300 overflow-hidden"
            onClick={() => setActiveView('identity')}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Fingerprint className="h-3.5 w-3.5 relative z-10" />
            <span className="hidden sm:inline text-xs relative z-10">
              {userProfile.fullName ? 'My Identity' : 'Set Up Identity'}
            </span>
            {userProfile.fullName && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
            )}
          </Button>

          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center bg-emerald-500 text-black border-0 font-bold">
                {unreadCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border-border/60" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView('identity')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Crown className="mr-2 h-4 w-4 text-emerald-400" />
                <span>Upgrade Plan</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/5"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* AI Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Ask LeadReach AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Find accounting firms in Dubai..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit()}
                className="flex-1 bg-secondary/50 border-border/50 focus:border-emerald-500/30"
              />
              <Button
                onClick={handleAiSubmit}
                disabled={aiLoading || !aiQuery.trim()}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all duration-200"
              >
                {aiLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {aiResponse && (
              <div className="rounded-lg border border-border/50 bg-secondary/30 p-4 text-sm whitespace-pre-wrap text-foreground/90">
                {aiResponse}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {[
                'Find accounting firms in Dubai',
                'Search for tech startups in Singapore',
                'Create outreach for hot leads',
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-xs border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 transition-all"
                  onClick={() => {
                    setAiQuery(suggestion);
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
