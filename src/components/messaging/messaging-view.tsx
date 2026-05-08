'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  MessageCircle,
  Camera,
  Users,
  Mail,
  Plus,
  Zap,
  Send,
  Sparkles,
  Loader2,
  Layers,
  CheckCircle2,
  Globe,
  Settings,
  CornerDownLeft,
  BarChart3,
  Heart,
  ArrowUpRight,
} from 'lucide-react';

const CHANNELS = [
  { id: 'sms', name: 'SMS', icon: MessageSquare, status: 'connected', messagesSent: 1247, responseRate: 68, color: '#10B981' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, status: 'connected', messagesSent: 2891, responseRate: 74, color: '#25D366' },
  { id: 'instagram', name: 'Instagram DM', icon: Camera, status: 'connected', messagesSent: 534, responseRate: 52, color: '#E1306C' },
  { id: 'messenger', name: 'Facebook Messenger', icon: Users, status: 'connected', messagesSent: 892, responseRate: 61, color: '#0084FF' },
  { id: 'email', name: 'Email', icon: Mail, status: 'connected', messagesSent: 3456, responseRate: 34, color: '#6366F1' },
];

const DEMO_CONVERSATIONS = [
  { id: '1', leadName: 'Sarah Johnson', channel: 'whatsapp', lastMessage: 'Yes, I\'d love to schedule a call! When are you free?', time: '2 min ago', status: 'qualified', score: 85 },
  { id: '2', leadName: 'Mike Chen', channel: 'sms', lastMessage: 'What\'s the pricing for the Pro plan?', time: '8 min ago', status: 'active', score: 62 },
  { id: '3', leadName: 'Emma Wilson', channel: 'instagram', lastMessage: 'This looks interesting! Can you tell me more?', time: '15 min ago', status: 'active', score: 78 },
  { id: '4', leadName: 'David Park', channel: 'messenger', lastMessage: 'I need to think about it. Can you follow up next week?', time: '1 hr ago', status: 'nurture', score: 45 },
  { id: '5', leadName: 'Lisa Rodriguez', channel: 'email', lastMessage: 'Re: Partnership Opportunity - Streamline Your Practice', time: '3 hrs ago', status: 'replied', score: 72 },
  { id: '6', leadName: 'James Liu', channel: 'whatsapp', lastMessage: 'Great! I\'m available Thursday at 2pm.', time: '5 hrs ago', status: 'booked', score: 92 },
];

export function MessagingView() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('sms');
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'sms': return MessageSquare;
      case 'whatsapp': return MessageCircle;
      case 'instagram': return Camera;
      case 'messenger': return Users;
      case 'email': return Mail;
      default: return MessageSquare;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Multi-Channel Messaging</h2>
          <p className="text-sm text-muted-foreground">
            Every channel connected. SMS, WhatsApp, Instagram, and Facebook Messenger in one place.
          </p>
        </div>
        <Button onClick={() => setComposeOpen(true)} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2">
          <Plus className="h-4 w-4" />
          Send Message
        </Button>
      </div>

      {/* Channel Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CHANNELS.map((channel) => {
          const Icon = channel.icon;
          return (
            <Card key={channel.id} className="card-premium border-border/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: channel.color }} />
              <CardContent className="p-4 text-center">
                <div className="rounded-lg p-2 inline-flex mx-auto mb-2" style={{ backgroundColor: `${channel.color}12`, color: channel.color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground/90">{channel.name}</h3>
                <div className="mt-2 space-y-1">
                  <div className="text-lg font-bold text-foreground/80">{channel.messagesSent.toLocaleString()}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Messages Sent</div>
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <div className="text-xs text-muted-foreground">Response: </div>
                  <div className="text-xs font-bold text-emerald-400">{channel.responseRate}%</div>
                </div>
                <Badge variant="outline" className="mt-2 text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Connected
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* GHL Integration + Features Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="card-premium border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg p-2.5 bg-emerald-500/15 text-emerald-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground/90">GoHighLevel Integration</h3>
                <p className="text-xs text-muted-foreground">Native connection — setup in minutes, not hours</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Direct GHL integration means all your conversations, contacts, and calendar sync seamlessly. No manual data entry, no missed hand-offs, no lost context between your AI setter and your CRM.
            </p>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5 text-[10px]">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
              <span className="text-xs text-muted-foreground">More CRM integrations launching soon</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium border-border/30">
          <CardContent className="p-5">
            <h3 className="font-semibold text-foreground/90 mb-3">Platform Capabilities</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'A/B Split Testing', icon: BarChart3 },
                { label: 'Custom AI Tasks', icon: Settings },
                { label: 'Follow-up System', icon: CornerDownLeft },
                { label: 'Sub-Accounts', icon: Users },
                { label: '17+ Languages', icon: Globe },
                { label: 'Smart Qualification', icon: Heart },
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-border/25 bg-secondary/15 p-2.5">
                  <feat.icon className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-muted-foreground">{feat.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Stream */}
      <Card className="card-premium border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
            <Zap className="h-4 w-4 text-amber-400" />
            Live Conversations
            <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
              {DEMO_CONVERSATIONS.filter(c => c.status === 'active' || c.status === 'qualified').length} active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {DEMO_CONVERSATIONS.map((conv) => {
              const Icon = getChannelIcon(conv.channel);
              return (
                <div key={conv.id} className="flex items-center gap-3 rounded-lg border border-border/25 bg-secondary/10 p-3 hover:bg-secondary/15 transition-colors">
                  <div className="shrink-0">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground/90">{conv.leadName}</span>
                      <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">{conv.channel}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{conv.lastMessage}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-muted-foreground">{conv.time}</div>
                    <Badge variant="outline" className={`text-[9px] mt-0.5 ${
                      conv.status === 'booked' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                      conv.status === 'qualified' ? 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5' :
                      conv.status === 'replied' ? 'border-blue-500/20 text-blue-400 bg-blue-500/5' :
                      conv.status === 'nurture' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                      'border-border/30 text-muted-foreground bg-secondary/20'
                    }`}>
                      {conv.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Send className="h-5 w-5 text-emerald-400" />
              Send Message
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                return (
                  <Button key={ch.id} variant={selectedChannel === ch.id ? 'default' : 'outline'} size="sm"
                    className={`gap-1.5 text-xs ${selectedChannel === ch.id ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'border-border/40 text-muted-foreground'}`}
                    onClick={() => setSelectedChannel(ch.id)}>
                    <Icon className="h-3.5 w-3.5" />
                    {ch.name}
                  </Button>
                );
              })}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground/80">Message</label>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" disabled={generating}>
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Generate with AI
                </Button>
              </div>
              <Textarea placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="resize-none bg-secondary/30 border-border/40" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)} className="border-border/40">Cancel</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2" disabled={!message.trim()}>
              <Send className="h-4 w-4" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
