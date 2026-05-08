'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  MessageSquare,
  Zap,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  Star,
  ArrowRight,
} from 'lucide-react';

const DEMO_BOOKINGS = [
  { id: '1', leadName: 'Sarah Johnson', setterName: 'Sales Setter Pro', date: 'Today, 2:00 PM', channel: 'whatsapp', status: 'confirmed', notes: 'Demo call for coaching package' },
  { id: '2', leadName: 'Alex Rivera', setterName: 'Agency Setter', date: 'Today, 3:30 PM', channel: 'sms', status: 'confirmed', notes: 'Strategy session' },
  { id: '3', leadName: 'Emma Wilson', setterName: 'Global Setter', date: 'Tomorrow, 10:00 AM', channel: 'instagram', status: 'pending', notes: 'Initial consultation' },
  { id: '4', leadName: 'James Chen', setterName: 'Sales Setter Pro', date: 'Tomorrow, 1:00 PM', channel: 'messenger', status: 'confirmed', notes: 'Follow-up on proposal' },
  { id: '5', leadName: 'Priya Patel', setterName: 'Agency Setter', date: 'Tomorrow, 4:00 PM', channel: 'whatsapp', status: 'pending', notes: 'Pricing discussion' },
  { id: '6', leadName: 'Marcus Brown', setterName: 'Global Setter', date: 'May 10, 11:00 AM', channel: 'sms', status: 'confirmed', notes: 'Onboarding call' },
];

const BOOKING_METRICS = {
  todayBookings: 3,
  weekBookings: 18,
  conversionRate: 34.2,
  avgTimeToBook: '8 min',
  pipeline: {
    engaged: 156,
    qualifying: 89,
    proposed: 42,
    booked: 28,
  },
};

export function BookingView() {
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');

  const filteredBookings = DEMO_BOOKINGS.filter(b => {
    if (filter === 'today') return b.date.includes('Today');
    if (filter === 'upcoming') return b.date.includes('Tomorrow') || b.date.includes('May');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Conversational AI Booking</h2>
        <p className="text-sm text-muted-foreground">
          From &ldquo;interested&rdquo; to &ldquo;booked&rdquo; in one conversation — no booking links needed
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Human-like Scheduling', desc: 'AI guides prospects to book naturally through conversation. No awkward forms or scheduling pages — just smooth, intelligent dialogue that feels personal and genuine.', icon: MessageSquare, color: '#10B981' },
          { title: 'Real-time Calendar Sync', desc: 'Knows your availability and confirms instantly. Your AI setter checks your calendar in real-time and proposes time slots that work for both parties.', icon: Calendar, color: '#3B82F6' },
          { title: 'Zero Friction Booking', desc: 'No redirects, no scheduling pages, no abandoned bookings. Just seamless appointment setting from interested to booked in one conversation.', icon: Zap, color: '#F59E0B' },
        ].map((item, i) => (
          <Card key={i} className="card-premium border-border/30 bg-card/50">
            <CardContent className="p-5">
              <div className="rounded-lg p-2.5 inline-flex mb-3" style={{ backgroundColor: `${item.color}12`, color: item.color }}>
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Booking Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard title="Today's Bookings" value={BOOKING_METRICS.todayBookings} icon={Calendar} accent="emerald" />
        <MetricCard title="This Week" value={BOOKING_METRICS.weekBookings} icon={TrendingUp} accent="cyan" />
        <MetricCard title="Booking Rate" value={`${BOOKING_METRICS.conversionRate}%`} icon={Star} accent="amber" />
        <MetricCard title="Avg Time to Book" value={BOOKING_METRICS.avgTimeToBook} icon={Clock} accent="violet" />
      </div>

      {/* Booking Pipeline */}
      <Card className="card-premium border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
            <ArrowRight className="h-4 w-4 text-emerald-400" />
            Booking Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { label: 'Lead Engaged', count: BOOKING_METRICS.pipeline.engaged, color: 'bg-blue-400' },
              { label: 'AI Qualifying', count: BOOKING_METRICS.pipeline.qualifying, color: 'bg-cyan-400' },
              { label: 'Booking Proposed', count: BOOKING_METRICS.pipeline.proposed, color: 'bg-amber-400' },
              { label: 'Appointment Set', count: BOOKING_METRICS.pipeline.booked, color: 'bg-emerald-400' },
            ].map((stage, i) => (
              <React.Fragment key={stage.label}>
                <div className="flex-1 min-w-[140px] rounded-lg border border-border/30 bg-secondary/15 p-3 text-center">
                  <div className={`h-2 w-12 rounded-full mx-auto mb-2 ${stage.color}`} />
                  <div className="text-lg font-bold text-foreground/90">{stage.count}</div>
                  <div className="text-[10px] text-muted-foreground">{stage.label}</div>
                </div>
                {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card className="card-premium border-border/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground/90">Upcoming Appointments</CardTitle>
            <div className="flex gap-1.5">
              {(['all', 'today', 'upcoming'] as const).map((f) => (
                <Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm"
                  className={`text-[10px] h-7 ${filter === f ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'text-muted-foreground'}`}
                  onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="flex items-center gap-3 rounded-lg border border-border/25 bg-secondary/10 p-3 hover:bg-secondary/15 transition-colors">
                <div className="shrink-0">
                  <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground/90">{booking.leadName}</span>
                    <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                      {booking.channel}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    via {booking.setterName} &bull; {booking.notes}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-medium text-foreground/80">{booking.date}</div>
                  <Badge variant="outline" className={`text-[9px] mt-1 ${
                    booking.status === 'confirmed'
                      ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                      : 'border-amber-500/20 text-amber-400 bg-amber-500/5'
                  }`}>
                    {booking.status === 'confirmed' && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                    {booking.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, accent }: {
  title: string; value: number | string; icon: React.ElementType; accent: string;
}) {
  const s: Record<string, { icon: string; glow: string; bg: string }> = {
    emerald: { icon: 'text-emerald-400', glow: 'from-emerald-500/6 to-emerald-500/2', bg: 'bg-emerald-500/10' },
    cyan: { icon: 'text-cyan-400', glow: 'from-cyan-500/6 to-cyan-500/2', bg: 'bg-cyan-500/10' },
    amber: { icon: 'text-amber-400', glow: 'from-amber-500/6 to-amber-500/2', bg: 'bg-amber-500/10' },
    violet: { icon: 'text-violet-400', glow: 'from-violet-500/6 to-violet-500/2', bg: 'bg-violet-500/10' },
  };
  const style = s[accent] || s.emerald;
  return (
    <Card className={`card-premium border-border/30 bg-gradient-to-br ${style.glow}`}>
      <CardContent className="p-4 text-center">
        <Icon className={`h-5 w-5 mx-auto mb-1.5 ${style.icon}`} />
        <div className="text-2xl font-bold text-foreground/95">{value}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{title}</div>
      </CardContent>
    </Card>
  );
}
