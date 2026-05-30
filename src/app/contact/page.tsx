'use client';

import React, { useState } from 'react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Mail, MapPin, Phone, Clock, Send, MessageSquare } from 'lucide-react';

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: 'Email',
    detail: 'hello@leadreach.ai',
    description: 'General inquiries and partnership opportunities. We typically respond within 24 hours on business days.',
  },
  {
    icon: Phone,
    title: 'Phone',
    detail: '+1 (415) 555-0147',
    description: 'Available Monday through Friday, 9 AM to 6 PM Pacific Time for urgent matters and enterprise discussions.',
  },
  {
    icon: MapPin,
    title: 'Office',
    detail: 'San Francisco, CA',
    description: '548 Market Street, Suite 36879, San Francisco, CA 94104. Our team works remotely but we maintain a mailing address.',
  },
  {
    icon: Clock,
    title: 'Support Hours',
    detail: '24/7 for paid plans',
    description: 'Priority support is available around the clock for Professional and Enterprise customers. Starter and trial users receive support during business hours.',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production this would post to an API route
    setSubmitted(true);
  };

  return (
    <MarketingLayout>
      {/* Header */}
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
              Have a question, want a demo, or interested in a partnership? We would love to hear from you. Our team typically responds within 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CONTACT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.title}
                  className="rounded-xl border border-border/30 bg-card/50 p-6 hover:border-emerald-500/20 transition-colors"
                >
                  <div className="rounded-lg bg-emerald-500/10 p-2.5 w-fit mb-4">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">{method.title}</h3>
                  <p className="text-sm font-medium text-emerald-400 mb-2">{method.detail}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{method.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 lg:py-20 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Send Us a <span className="text-gradient">Message</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Fill out the form and our team will get back to you as soon as possible. Whether you have a technical question, need help with your account, or want to explore enterprise solutions, we are here to help.
              </p>
              <div className="space-y-4">
                <div className="rounded-xl border border-border/30 bg-card/50 p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Sales Inquiries</h4>
                  <p className="text-xs text-muted-foreground">sales@leadreach.ai — For pricing, demos, and enterprise discussions.</p>
                </div>
                <div className="rounded-xl border border-border/30 bg-card/50 p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Technical Support</h4>
                  <p className="text-xs text-muted-foreground">support@leadreach.ai — For platform issues, bug reports, and integration help.</p>
                </div>
                <div className="rounded-xl border border-border/30 bg-card/50 p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Partnerships</h4>
                  <p className="text-xs text-muted-foreground">partners@leadreach.ai — For API integrations, co-marketing, and channel partnerships.</p>
                </div>
              </div>
            </div>
            <div>
              {submitted ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
                  <div className="rounded-full bg-emerald-500/10 p-3 w-fit mx-auto mb-4">
                    <Send className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-sm text-muted-foreground">
                    Thank you for reaching out. Our team will review your message and respond within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 border-border/40 text-muted-foreground hover:text-foreground"
                    onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-border/40 bg-card/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-border/40 bg-card/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
                    <select
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-lg border border-border/40 bg-card/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                    >
                      <option value="">Select a topic...</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership Opportunity</option>
                      <option value="enterprise">Enterprise Solutions</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">Message</label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-lg border border-border/40 bg-card/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm"
                  >
                    Send Message
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
