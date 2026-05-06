'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Mail,
  Send,
  Sparkles,
  Clock,
  CheckCircle2,
  Eye,
  ExternalLink,
  Plus,
  Filter,
  ArrowUpRight,
  Loader2,
  MessageSquare,
  Linkedin,
  Phone,
} from 'lucide-react';
import type { OutreachChannel, OutreachType, OutreachStatus } from '@/lib/types';

interface OutreachItem {
  id: string;
  leadId: string;
  channel: string;
  type: string;
  subject: string | null;
  body: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  createdAt: string;
  lead: {
    companyName: string;
    keyContactName: string | null;
  };
}

interface LeadOption {
  id: string;
  companyName: string;
  keyContactName: string | null;
  keyContactEmail: string | null;
  leadTier: string;
  stage: string;
}

export function OutreachView() {
  const [outreach, setOutreach] = useState<OutreachItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [leads, setLeads] = useState<LeadOption[]>([]);

  // Compose form
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [channel, setChannel] = useState<string>('email');
  const [msgType, setMsgType] = useState<string>('cold_email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    loadOutreach();
  }, [statusFilter]);

  const loadOutreach = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/outreach?${params}`);
      const data = await res.json();
      setOutreach(data);
    } catch (error) {
      console.error('Error loading outreach:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const res = await fetch('/api/leads?stage=qualified&limit=50');
      const data = await res.json();
      setLeads(
        (data.leads || []).map((l: LeadOption) => ({
          id: l.id,
          companyName: l.companyName,
          keyContactName: l.keyContactName,
          keyContactEmail: l.keyContactEmail,
          leadTier: l.leadTier,
          stage: l.stage,
        }))
      );
    } catch (error) {
      console.error('Error loading leads:', error);
    }
  };

  const handleOpenCompose = () => {
    loadLeads();
    setComposeOpen(true);
  };

  const handleGenerateAI = async () => {
    if (!selectedLeadId) return;
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (!lead) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a ${msgType.replace(/_/g, ' ')} message for ${lead.companyName} (${channel} channel). Contact: ${lead.keyContactName || 'Decision Maker'}. Make it professional, concise, and compelling.`,
        }),
      });
      const data = await res.json();

      if (data.response) {
        // Parse the response to extract subject and body
        const lines = data.response.split('\n');
        const subjectLine = lines.find((l: string) => l.toLowerCase().startsWith('subject:') || l.toLowerCase().startsWith('subject :'));
        if (subjectLine) {
          setSubject(subjectLine.replace(/^subject\s*:\s*/i, ''));
          setBody(lines.slice(lines.indexOf(subjectLine) + 1).join('\n').trim());
        } else {
          setBody(data.response);
        }
      }
    } catch (error) {
      console.error('Error generating message:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!selectedLeadId || !body.trim()) return;
    setComposing(true);
    try {
      await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId,
          channel,
          type: msgType,
          subject: subject || null,
          body,
        }),
      });
      setComposeOpen(false);
      resetForm();
      loadOutreach();
    } catch (error) {
      console.error('Error sending outreach:', error);
    } finally {
      setComposing(false);
    }
  };

  const resetForm = () => {
    setSelectedLeadId('');
    setChannel('email');
    setMsgType('cold_email');
    setSubject('');
    setBody('');
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-3.5 w-3.5 text-gray-400" />;
      case 'sent': return <Send className="h-3.5 w-3.5 text-blue-500" />;
      case 'delivered': return <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />;
      case 'opened': return <Eye className="h-3.5 w-3.5 text-emerald-500" />;
      case 'replied': return <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />;
      case 'bounced': return <ExternalLink className="h-3.5 w-3.5 text-red-500" />;
      case 'failed': return <ExternalLink className="h-3.5 w-3.5 text-red-500" />;
      default: return <Clock className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'border-gray-500/30 text-gray-500',
      sent: 'border-blue-500/30 text-blue-600',
      delivered: 'border-blue-500/30 text-blue-600',
      opened: 'border-emerald-500/30 text-emerald-600',
      replied: 'border-emerald-600/30 text-emerald-700',
      bounced: 'border-red-500/30 text-red-600',
      failed: 'border-red-500/30 text-red-600',
    };
    return styles[status] || styles.draft;
  };

  const channelIcon = (ch: string) => {
    switch (ch) {
      case 'email': return <Mail className="h-3.5 w-3.5" />;
      case 'linkedin': return <Linkedin className="h-3.5 w-3.5" />;
      case 'phone': return <Phone className="h-3.5 w-3.5" />;
      default: return <Mail className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Outreach</h2>
          <p className="text-sm text-muted-foreground">
            Manage outreach messages and sequences
          </p>
        </div>
        <Button
          onClick={handleOpenCompose}
          className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Compose Message
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'draft', 'sent', 'delivered', 'opened', 'replied', 'bounced'].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            className={`text-xs ${statusFilter === s ? 'bg-emerald-500 text-white hover:bg-emerald-600' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Outreach List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : outreach.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No outreach messages</h3>
          <p className="text-sm text-muted-foreground">
            Compose your first outreach message to start engaging leads
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {outreach.map((item) => (
            <Card key={item.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {channelIcon(item.channel)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {item.lead.companyName}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ${statusBadge(item.status)}`}>
                        {statusIcon(item.status)}
                        <span className="ml-1 capitalize">{item.status}</span>
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {item.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {item.subject && (
                      <div className="text-sm font-medium truncate">
                        {item.subject}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {item.body}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>{item.channel}</span>
                      {item.sentAt && <span>Sent {new Date(item.sentAt).toLocaleDateString()}</span>}
                      {item.openedAt && <span>Opened {new Date(item.openedAt).toLocaleDateString()}</span>}
                      {item.repliedAt && <span>Replied {new Date(item.repliedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-500" />
              Compose Outreach
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lead</label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Channel</label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={msgType} onValueChange={setMsgType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cold_email">Cold Email</SelectItem>
                    <SelectItem value="warm_intro">Warm Intro</SelectItem>
                    <SelectItem value="connection_request">Connection Request</SelectItem>
                    <SelectItem value="follow_up_1">Follow-up #1</SelectItem>
                    <SelectItem value="follow_up_2">Follow-up #2</SelectItem>
                    <SelectItem value="break_up">Break-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {channel === 'email' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Email subject line..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Message</label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                  onClick={handleGenerateAI}
                  disabled={generating || !selectedLeadId}
                >
                  {generating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Generate with AI
                </Button>
              </div>
              <Textarea
                placeholder="Write your message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!selectedLeadId || !body.trim() || composing}
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
            >
              {composing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Save as Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
