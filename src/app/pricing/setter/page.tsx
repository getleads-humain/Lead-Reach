'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Zap,
  Target,
  Users,
  BarChart3,
  Mail,
  MessageCircle,
  Phone,
  Calendar,
  Bot,
  Globe,
  Clock,
  Megaphone,
  UserCheck,
  Handshake,
} from 'lucide-react';

export default function SetterPlanPage() {
  return (
    <div className="min-h-screen bg-background noise-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/50 glass px-4">
        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              All Plans
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Megaphone className="h-3 w-3 mr-1" />
            B2C Standard
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Setter <span className="text-gradient">Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            For solopreneurs and small businesses automating appointment setting. Setter deploys 2 AI Setters that handle lead qualification, conversational booking, and follow-up across SMS and email — so you can focus on showing up and closing.
          </p>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-5xl font-bold text-foreground">$97</span>
            <span className="text-lg text-muted-foreground">/month</span>
          </div>
          <p className="text-sm text-emerald-400 mb-8">Or $970/year (save 17% — just $81/mo)</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/app">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald text-base px-8 h-12">
                Start 14-Day Free Trial
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-3">No credit card required for trial</p>
        </div>

        {/* Who It's For */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Who is <span className="text-gradient">Setter</span> for?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <UserCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Solopreneurs</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Individual service providers — coaches, consultants, trainers, therapists, real estate agents — who spend too much time on back-and-forth scheduling and not enough time delivering value. Setter automates the entire booking conversation so your calendar fills itself while you focus on your craft.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Handshake className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Small Local Businesses</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Local businesses — salons, fitness studios, dental offices, auto shops — that want to capture and convert inbound leads from SMS and email into booked appointments automatically. Setter handles the entire conversation from first contact to confirmed booking, including reschedules and reminders.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Phone className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Appointment-Driven Professionals</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Any professional whose revenue depends on booked appointments — financial advisors, insurance agents, mortgage brokers, legal consultants. Setter qualifies leads, answers common questions, handles objections, and books meetings directly on your calendar, 24 hours a day, 7 days a week.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Features */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Everything included in <span className="text-gradient">Setter</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Bot className="h-5 w-5 text-emerald-400" />,
                title: '2 AI Setters',
                desc: 'Deploy two AI-powered appointment setters that handle lead conversations autonomously. Each setter can be configured with its own qualification rules, messaging style, and booking calendar. They greet leads, ask qualifying questions, address common objections, confirm availability, and book appointments directly onto your calendar — all without human intervention.',
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-emerald-400" />,
                title: '500 Leads Per Month',
                desc: 'Setter handles up to 500 lead conversations per month across your channels. Each lead receives personalized, conversational engagement that qualifies them before booking. For most solopreneurs and small businesses, 500 monthly conversations translates to a steady stream of 30 to 80 qualified appointments filling your calendar every month.',
              },
              {
                icon: <MessageCircle className="h-5 w-5 text-emerald-400" />,
                title: 'SMS + Email Channels',
                desc: 'Engage leads on the two highest-converting B2C channels: SMS and email. SMS delivers near-instant response times and 98% open rates, making it perfect for time-sensitive booking confirmations and reminders. Email handles longer qualification conversations and nurture sequences. Both channels work together seamlessly within each setter\'s conversation flow.',
              },
              {
                icon: <Target className="h-5 w-5 text-emerald-400" />,
                title: 'Basic Qualification',
                desc: 'Configure qualification rules that automatically filter leads based on your criteria. Ask up to 5 qualifying questions in natural conversation, score responses, and route only qualified leads to the booking stage. Unqualified leads receive polite disqualification messages and can be enrolled in nurture sequences for future re-engagement.',
              },
              {
                icon: <Calendar className="h-5 w-5 text-emerald-400" />,
                title: 'Conversational Calendar Booking',
                desc: 'Leads book appointments through natural conversation — no clunky booking links or forms. The AI setter checks your real-time availability, proposes time slots, handles reschedules, and sends confirmation messages with calendar invites. Integration with Google Calendar, Calendly, and GoHighLevel calendars ensures your availability is always accurate.',
              },
              {
                icon: <Mail className="h-5 w-5 text-emerald-400" />,
                title: 'Standard Follow-Up',
                desc: 'Automated follow-up sequences ensure no lead falls through the cracks. If a lead does not respond within a configurable time window, the setter sends a polite follow-up. If they reschedule, the setter confirms the new time and sends reminders. Standard follow-up includes up to 5 touchpoints per lead with customizable delays between messages.',
              },
              {
                icon: <Globe className="h-5 w-5 text-emerald-400" />,
                title: '1 Language + 1 User Seat',
                desc: 'Setter supports one language for all conversations (English by default, with 16+ additional languages available on higher plans). One user seat gives you full access to the platform, including dashboard analytics, conversation logs, and setter configuration. Upgrade to Closer for multilingual support and multiple team members.',
              },
              {
                icon: <Clock className="h-5 w-5 text-emerald-400" />,
                title: '14-Day Free Trial + Standard Support',
                desc: 'Try Setter risk-free for 14 days with full access to all features. No credit card required to start. During and after your trial, standard support is available to help you configure setters, set up qualification rules, and optimize your booking flow. Response time is within 12 hours on business days.',
              },
            ].map((feature, i) => (
              <Card key={i} className="border-border/30 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-emerald-500/10 p-2.5 shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Upgrade Path */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Ready to <span className="text-gradient">scale your bookings?</span>
          </h2>
          <Card className="border-emerald-500/20 bg-card/80 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">Upgrade to Closer for unlimited setters and 20x volume</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Closer unlocks unlimited AI setters, 10,000+ leads per month, all conversational channels (SMS, WhatsApp, Instagram, Facebook, Email), 17+ languages, A/B testing, GHL CRM integration, and custom AI tasks. It is the complete appointment-setting machine for teams and agencies.
                  </p>
                  <div className="space-y-2">
                    {[
                      'Unlimited AI Setters',
                      '10,000+ leads/month across all channels',
                      'WhatsApp, Instagram, Facebook + SMS + Email',
                      '17+ languages & A/B testing',
                      'GHL CRM integration & Custom AI tasks',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center md:text-right shrink-0">
                  <p className="text-sm text-muted-foreground mb-1">Starting at</p>
                  <p className="text-3xl font-bold text-foreground">$297<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <Link href="/pricing/closer">
                    <Button className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-1">
                      Explore Closer
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Frequently asked <span className="text-gradient">questions</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              {
                q: 'How do AI Setters handle conversations?',
                a: 'AI Setters use natural language processing to engage leads in human-like conversations. They greet the lead, ask qualifying questions based on your rules, handle common objections, propose available time slots, and confirm bookings — all through conversational messages on SMS or email. The setter understands context, remembers previous messages in the conversation, and responds appropriately to questions, objections, and requests.',
              },
              {
                q: 'Can I customize what the setter says?',
                a: 'Yes. You configure the greeting, qualification questions, objection responses, and booking confirmation messages. The AI uses your configured scripts as a framework but adapts naturally to each conversation. You can also set the tone (professional, friendly, casual) and specify industry-specific terminology to ensure the conversation feels authentic to your business.',
              },
              {
                q: 'What happens when a lead is qualified?',
                a: 'When a lead passes your qualification criteria, the setter checks your real-time calendar availability and proposes time slots. The lead selects a time, the setter confirms the booking, sends a calendar invite, and optionally triggers a confirmation SMS or email. If you use GoHighLevel, the appointment is automatically synced to your GHL pipeline.',
              },
              {
                q: 'What happens when a lead is not qualified?',
                a: 'When a lead does not meet your qualification criteria, the setter sends a polite disqualification message. You can optionally enroll disqualified leads in a nurture sequence for future re-engagement, or simply close the conversation. Qualification rules are fully customizable so you define exactly what constitutes a qualified lead for your business.',
              },
              {
                q: 'Can I see the conversations my setters are having?',
                a: 'Yes. Every conversation is logged and accessible from your dashboard in real time. You can view the full message history, see the qualification score, check the booking status, and even intervene manually if needed. Conversation analytics show you common questions, objection patterns, and conversion rates so you can continuously optimize your setter configuration.',
              },
              {
                q: 'How many qualification questions can I set?',
                a: 'The Setter plan supports up to 5 qualifying questions per setter. Each question can have weighted scoring so some criteria matter more than others. If you need more complex qualification logic, Closer and Agency plans support unlimited qualification questions with conditional branching based on previous answers.',
              },
            ].map((faq, i) => (
              <Card key={i} className="border-border/30 bg-card/80">
                <CardContent className="p-5">
                  <h4 className="text-sm font-semibold text-foreground mb-2">{faq.q}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Start booking appointments <span className="text-gradient">on autopilot</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                14-day free trial. No credit card required. Let AI setters fill your calendar.
              </p>
              <Link href="/app">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald text-base px-8 h-12">
                  Start Free Trial
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
