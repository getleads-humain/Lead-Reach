'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Building2,
  Zap,
  Headphones,
  Send,
  CheckCircle2,
} from 'lucide-react';

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: 'General Inquiries',
    email: 'hello@leadreach.ai',
    description: 'For general questions about LeadReach AI, partnership opportunities, or anything else. We respond within one business day.',
  },
  {
    icon: Headphones,
    title: 'Technical Support',
    email: 'support@leadreach.ai',
    description: 'For technical issues, bug reports, or platform questions. Our support team provides detailed, step-by-step assistance.',
  },
  {
    icon: Building2,
    title: 'Sales & Enterprise',
    email: 'sales@leadreach.ai',
    description: 'For enterprise pricing, custom deployments, or volume licensing. Our sales team can also schedule a personalized demo.',
  },
  {
    icon: MessageSquare,
    title: 'Press & Media',
    email: 'press@leadreach.ai',
    description: 'For press inquiries, interview requests, and media resources. Visit our Press page for brand assets and company information.',
  },
];

const OFFICES = [
  {
    city: 'San Francisco',
    region: 'California',
    address: '548 Market Street, Suite 36879',
    type: 'Headquarters',
    timezone: 'Pacific Time (PT)',
  },
  {
    city: 'New York',
    region: 'New York',
    address: 'Remote Hub — Contact for Meetings',
    type: 'Sales & Customer Success',
    timezone: 'Eastern Time (ET)',
  },
  {
    city: 'London',
    region: 'United Kingdom',
    address: 'Remote Hub — Contact for Meetings',
    type: 'EMEA Operations',
    timezone: 'Greenwich Mean Time (GMT)',
  },
];

const INQUIRY_TYPES = [
  'General Inquiry',
  'Sales & Pricing',
  'Technical Support',
  'Partnership',
  'Press & Media',
  'Careers',
  'Feature Request',
  'Other',
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <MessageSquare className="h-3 w-3 mr-1" />
              Contact
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Get in <span className="text-gradient">Touch</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Whether you have a question about our platform, need technical support, or want to explore how LeadReach AI can transform your sales pipeline, we are here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-foreground mb-8">How to Reach Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CONTACT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <Card key={method.title} className="card-premium border-border/30 bg-card/50 p-5">
                  <div className="rounded-lg bg-emerald-500/10 p-2.5 w-fit mb-3">
                    <Icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{method.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{method.description}</p>
                  <a href={`mailto:${method.email}`} className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                    <Mail className="h-3 w-3" />
                    {method.email}
                  </a>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Offices */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <h2 className="text-xl font-bold text-foreground mb-2">Send Us a Message</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Fill out the form below and our team will get back to you as soon as possible. For urgent technical issues, please email support@leadreach.ai directly for faster response.
              </p>
              {submitted ? (
                <Card className="border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-foreground">Message Sent Successfully</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                    Thank you for reaching out. Our team will review your message and respond within one business day. For urgent matters, please contact us directly via email or live chat.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                    variant="outline"
                  >
                    Send Another Message
                  </Button>
                </Card>
              ) : (
                <Card className="border-border/30 bg-card/50 p-6 lg:p-8">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSubmitted(true);
                    }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">First Name</label>
                        <input
                          type="text"
                          required
                          className="w-full rounded-lg border border-border/40 bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-colors"
                          placeholder="Jane"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">Last Name</label>
                        <input
                          type="text"
                          required
                          className="w-full rounded-lg border border-border/40 bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-colors"
                          placeholder="Smith"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Work Email</label>
                      <input
                        type="email"
                        required
                        className="w-full rounded-lg border border-border/40 bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-colors"
                        placeholder="jane@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Company</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-border/40 bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-colors"
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Inquiry Type</label>
                      <select
                        className="w-full rounded-lg border border-border/40 bg-background/80 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-colors"
                      >
                        {INQUIRY_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Message</label>
                      <textarea
                        rows={5}
                        required
                        className="w-full rounded-lg border border-border/40 bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-colors resize-none"
                        placeholder="Tell us how we can help..."
                      />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      By submitting this form, you agree to our{' '}
                      <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors">Privacy Policy</Link>.
                      We will never share your information with third parties.
                    </p>
                  </form>
                </Card>
              )}
            </div>

            {/* Office Locations */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-foreground mb-2">Our Offices</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Visit us at any of our locations. We recommend scheduling a meeting in advance.
              </p>
              <div className="space-y-4">
                {OFFICES.map((office) => (
                  <Card key={office.city} className="border-border/30 bg-card/50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-emerald-500/10 p-2 shrink-0">
                        <MapPin className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{office.city}, {office.region}</h3>
                        <p className="text-xs text-emerald-400 font-medium mt-0.5">{office.type}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">{office.address}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {office.timezone}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Quick Links */}
              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-bold text-foreground">Quick Links</h3>
                <Link href="/support" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-400 transition-colors">
                  <ArrowRight className="h-3 w-3 text-emerald-500/50" />
                  Support Center
                </Link>
                <Link href="/docs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-400 transition-colors">
                  <ArrowRight className="h-3 w-3 text-emerald-500/50" />
                  Documentation
                </Link>
                <Link href="/faq" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-400 transition-colors">
                  <ArrowRight className="h-3 w-3 text-emerald-500/50" />
                  FAQ
                </Link>
                <Link href="/press" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-400 transition-colors">
                  <ArrowRight className="h-3 w-3 text-emerald-500/50" />
                  Press & Media
                </Link>
                <Link href="/careers" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-400 transition-colors">
                  <ArrowRight className="h-3 w-3 text-emerald-500/50" />
                  Careers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-16 border-t border-border/20 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <Zap className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Ready for a <span className="text-gradient">Personalized Demo</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                See how LeadReach AI can transform your lead generation pipeline. Our team will walk you through the platform with a customized demo tailored to your industry and use case.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="mailto:sales@leadreach.ai?subject=Demo Request">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Request a Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <Link href="/app">
                  <Button size="lg" variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
