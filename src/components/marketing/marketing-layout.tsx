'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, Menu, X, Github, Linkedin } from 'lucide-react';

/** ORCID brand icon — not available in lucide-react */
function OrcidIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={className}
      fill="currentColor"
    >
      <path d="M128 0C57.3 0 0 57.3 0 128s57.3 128 128 128 128-57.3 128-128S198.7 0 128 0zM71.3 71.3h18.5v84.4H71.3V71.3zm48.3 0h49.6c18.8 0 34.1 15.3 34.1 34.1 0 18.8-15.3 34.1-34.1 34.1h-31.1v34.5h-18.5V71.3zm18.5 17.3v33.5h31.1c9.3 0 16.8-7.5 16.8-16.8s-7.5-16.8-16.8-16.8h-31.1zM80.6 57.6c-6.4 0-11.6-5.2-11.6-11.6S74.2 34.4 80.6 34.4s11.6 5.2 11.6 11.6-5.2 11.6-11.6 11.6z" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
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
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all duration-200 glow-emerald-sm">
                  Get Started Free
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
                href="/login"
                className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block px-3 py-2 text-sm text-emerald-400 font-medium hover:text-emerald-300 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started Free &rarr;
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/50 marketing-footer">
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
                <a href="https://orcid.org/0009-0000-3925-4823" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="ORCID">
                  <OrcidIcon className="h-4 w-4" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="https://github.com/getleads-humain/Lead-Reach" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
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
                <li><Link href="/api-docs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">API</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Resources</h4>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/blog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/docs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link href="/support" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Company</h4>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/careers" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="/press" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Press</Link></li>
                <li><Link href="/contact" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Legal</h4>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookie-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</Link></li>
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
