'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, Menu, X, Github, Twitter, Linkedin } from 'lucide-react';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/agent', label: 'Agents' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
];

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background noise-bg">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full glass border-b border-border/30">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="rounded-lg bg-emerald-500/10 p-1.5 group-hover:bg-emerald-500/20 transition-colors">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-lg font-bold text-foreground">
                LeadReach{' '}
                <span className="text-gradient">AI</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/50"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA + Mobile Menu */}
            <div className="flex items-center gap-3">
              <Link href="/app">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all duration-200 glow-emerald-sm">
                  Launch Platform
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border/30 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/app"
                className="block px-3 py-2 text-sm text-emerald-400 font-medium hover:text-emerald-300 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Launch Platform &rarr;
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="rounded-lg bg-emerald-500/10 p-1.5">
                  <Zap className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-sm font-bold text-foreground">
                  LeadReach <span className="text-gradient">AI</span>
                </span>
              </Link>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Autonomous AI agents that discover, enrich, qualify, and engage leads while you sleep.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                  <Github className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Product</h4>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/agent" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Agents</Link></li>
                <li><Link href="/#pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
                <li><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Resources</h4>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/blog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
                <li><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><Link href="/faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
                <li><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Company</h4>
              <ul className="mt-4 space-y-2.5">
                <li><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Press</a></li>
                <li><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Legal</h4>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} LeadReach AI. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Built with autonomous AI agents. Powered by Agent-Reach.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
