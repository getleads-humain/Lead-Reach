'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Search,
  Sparkles,
  Menu,
  X,
  Send,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function TopBar() {
  const { notifications, markNotificationRead, sidebarCollapsed } = useAppStore();
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
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: aiQuery }),
      });
      const data = await res.json();
      setAiResponse(data.response || 'No response');

      if (data.plan) {
        // Create campaign if the plan suggests one
        if (data.plan.campaignName) {
          const campaignRes = await fetch('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.plan.campaignName,
              targetIndustry: data.plan.targetIndustry,
              targetLocation: data.plan.targetLocation,
            }),
          });
          const campaign = await campaignRes.json();

          // Create agent tasks
          if (data.agentTasks?.length && campaign.id) {
            for (const task of data.agentTasks) {
              await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...task,
                  campaignId: campaign.id,
                }),
              });
            }
          }
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
      <header
        className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Agentic Lead Generation Platform
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
            onClick={() => setSearchOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center bg-emerald-500 text-white border-0">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* AI Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
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
                className="flex-1"
              />
              <Button
                onClick={handleAiSubmit}
                disabled={aiLoading || !aiQuery.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {aiLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {aiResponse && (
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm whitespace-pre-wrap">
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
                  className="text-xs"
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
