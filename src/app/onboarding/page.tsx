'use client';

/**
 * LeadReach — User Onboarding Wizard
 * =====================================
 * Multi-step onboarding that collects:
 *   Step 1: Personal info (name, job title, phone)
 *   Step 2: Company info (company name, industry, size, website)
 *   Step 3: Use case & goals (what they want to use LeadReach for)
 *   Step 4: Done — redirect to portal
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, ArrowRight, ArrowLeft, User, Building2, Target, CheckCircle2, Sparkles } from 'lucide-react';
import { INDUSTRIES, COMPANY_SIZES } from '@/lib/types';

const STEPS = [
  { id: 1, title: 'About You', subtitle: 'Tell us a bit about yourself', icon: User },
  { id: 2, title: 'Your Company', subtitle: 'Help us personalize your experience', icon: Building2 },
  { id: 3, title: 'Your Goals', subtitle: 'What do you want to achieve?', icon: Target },
] as const;

const USE_CASES = [
  { id: 'b2b_leads', label: 'B2B Lead Generation', desc: 'Discover and qualify business prospects', icon: '🏢' },
  { id: 'b2c_setting', label: 'B2C AI Setting', desc: 'AI setters for appointment booking', icon: '📅' },
  { id: 'data_enrichment', label: 'Data Enrichment', desc: 'Enrich and score your existing leads', icon: '📊' },
  { id: 'outreach', label: 'AI Outreach', desc: 'Personalized multi-channel outreach', icon: '✉️' },
  { id: 'pipeline', label: 'Pipeline Management', desc: 'Track leads through your sales funnel', icon: '🔀' },
  { id: 'all', label: 'All of the above', desc: 'I want the full LeadReach experience', icon: '🚀' },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [jobTitle, setJobTitle] = useState(profile?.job_title || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  // Step 2 fields
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [industry, setIndustry] = useState(profile?.industry || '');
  const [companySize, setCompanySize] = useState(profile?.company_size || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [location, setLocation] = useState(profile?.location || '');

  // Step 3 fields
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);

  const toggleUseCase = (id: string) => {
    if (id === 'all') {
      setSelectedUseCases(prev => prev.includes('all') ? [] : ['all']);
      return;
    }
    setSelectedUseCases(prev => {
      const filtered = prev.filter(uc => uc !== 'all');
      if (filtered.includes(id)) {
        return filtered.filter(uc => uc !== id);
      }
      return [...filtered, id];
    });
  };

  const handleNext = async () => {
    setError(null);

    if (step === 1) {
      if (!fullName.trim()) {
        setError('Please enter your name');
        return;
      }
      // Save step 1
      await updateProfile({ full_name: fullName, job_title: jobTitle, phone });
      setStep(2);
    } else if (step === 2) {
      if (!companyName.trim()) {
        setError('Please enter your company name');
        return;
      }
      // Save step 2
      await updateProfile({
        company_name: companyName,
        industry,
        company_size: companySize,
        website,
        location,
        onboarding_step: 2,
      });
      setStep(3);
    } else if (step === 3) {
      if (selectedUseCases.length === 0) {
        setError('Please select at least one goal');
        return;
      }
      // Complete onboarding
      setLoading(true);
      const { error: err } = await updateProfile({
        onboarding_complete: true,
        onboarding_step: 3,
        bio: `Goals: ${selectedUseCases.join(', ')}`,
      });
      if (err) {
        setError(err);
        setLoading(false);
        return;
      }
      // Set cookie for middleware
      document.cookie = 'lr_onboarding_done=true; path=/; max-age=' + (60 * 60 * 24 * 365);
      router.push('/portal');
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background noise-bg relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />

      <div className="w-full max-w-2xl px-4 py-12 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 glow-emerald-sm">
              <Zap className="h-5 w-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              LeadReach <span className="text-gradient">AI</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set up your workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Let&apos;s personalize your experience in a few quick steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isComplete = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isComplete
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : isActive
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                      : 'border-border text-muted-foreground'
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`text-sm hidden sm:inline ${
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
                    {s.title}
                  </span>
                  {s.id < STEPS.length && (
                    <div className={`hidden sm:block w-12 h-0.5 rounded-full ${
                      step > s.id ? 'bg-emerald-500' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card className="card-premium border-border/30 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">About You</h2>
                  <p className="text-sm text-muted-foreground mt-1">We&apos;ll use this to personalize your dashboard and outreach</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job title</Label>
                    <Input
                      id="jobTitle"
                      placeholder="VP of Sales, Head of Growth, etc."
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Company Info */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Your Company</h2>
                  <p className="text-sm text-muted-foreground mt-1">This helps our AI agents understand your target market</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Acme Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <select
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full h-9 rounded-md border border-border/50 bg-secondary/30 px-3 text-sm text-foreground focus:outline-none focus:border-emerald-500/30"
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companySize">Company size</Label>
                      <select
                        id="companySize"
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                        className="w-full h-9 rounded-md border border-border/50 bg-secondary/30 px-3 text-sm text-foreground focus:outline-none focus:border-emerald-500/30"
                      >
                        <option value="">Select size</option>
                        {COMPANY_SIZES.map((size) => (
                          <option key={size} value={size}>{size} employees</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City, Country"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Company website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://acme.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Use Cases */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Your Goals</h2>
                  <p className="text-sm text-muted-foreground mt-1">Select what you want to achieve with LeadReach AI</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {USE_CASES.map((uc) => {
                    const isSelected = selectedUseCases.includes(uc.id);
                    return (
                      <button
                        key={uc.id}
                        type="button"
                        onClick={() => toggleUseCase(uc.id)}
                        className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                            : 'border-border/30 bg-secondary/10 hover:border-border/60 hover:bg-secondary/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{uc.icon}</span>
                          <div>
                            <div className={`text-sm font-medium ${isSelected ? 'text-emerald-400' : 'text-foreground'}`}>
                              {uc.label}
                            </div>
                            <div className="text-xs text-muted-foreground">{uc.desc}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/30">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm transition-all duration-200 min-w-[120px]"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                ) : step === STEPS.length ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Launch Portal
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
