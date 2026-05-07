'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Sparkles,
  Send,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { safeFetchJSON } from '@/lib/utils';

export function TopBar() {
  const { notifications, sidebarCollapsed } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;

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

          // Note: /api/ai already executes tasks via dispatchAndExecute().
          // We do NOT re-create tasks here to avoid duplicates.
          // The pipeline already ran server-side.
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

          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center bg-emerald-500 text-black border-0 font-bold">
                {unreadCount}
              </Badge>
            )}
          </Button>
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
