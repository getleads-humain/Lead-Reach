'use client';

/**
 * LeadReach — User Settings Page
 * ================================
 * Profile management, notification preferences, plan info, and account settings
 * with comprehensive billing management UI.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  User,
  Building2,
  Bell,
  Shield,
  Crown,
  Save,
  Zap,
  CheckCircle2,
  Loader2,
  CreditCard,
  FileText,
  Calendar,
  ExternalLink,
  Sparkles,
  Users,
  Target,
  Rocket,
  ChevronRight,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { INDUSTRIES, COMPANY_SIZES } from '@/lib/types';
import { PLANS, getPlanById, getFeatureAccess } from '@/lib/stripe-config';
import { toast } from 'sonner';

type BillingCycle = 'monthly' | 'annual';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, updateProfile, signOut, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Billing state
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [campaignAlerts, setCampaignAlerts] = useState(true);
  const [leadAlerts, setLeadAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Handle checkout URL params
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      toast.success('Subscription updated!', {
        description: 'Your plan has been successfully changed. Changes may take a moment to reflect.',
        duration: 6000,
      });
      // Clean up URL
      router.replace('/settings');
    } else if (checkoutStatus === 'cancelled') {
      toast.info('Checkout cancelled', {
        description: 'Your plan was not changed. No charges were made.',
        duration: 4000,
      });
      router.replace('/settings');
    }
  }, [searchParams, router]);

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setJobTitle(profile.job_title || '');
      setPhone(profile.phone || '');
      setCompanyName(profile.company_name || '');
      setIndustry(profile.industry || '');
      setCompanySize(profile.company_size || '');
      setWebsite(profile.website || '');
      setLocation(profile.location || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  // ── Stripe Checkout ──────────────────────────────────────────────
  const handleCheckout = useCallback(async (planId: string, cycle: BillingCycle) => {
    setCheckoutLoading(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, cycle }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error('Checkout failed', { description: data.error || 'Something went wrong.' });
        return;
      }

      // Custom plan — contact sales
      if (data.contactSales) {
        toast.info('Contact Sales', {
          description: data.message || 'This plan requires a custom setup. Our team will reach out.',
          duration: 8000,
        });
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error('Network error', { description: 'Could not connect to the server. Please try again.' });
    } finally {
      setCheckoutLoading(null);
    }
  }, []);

  // ── Stripe Portal ────────────────────────────────────────────────
  const handlePortal = useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error('Portal unavailable', { description: data.error || 'Could not open billing portal.' });
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error('Network error', { description: 'Could not connect to the server. Please try again.' });
    } finally {
      setPortalLoading(false);
    }
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaved(false);
    await updateProfile({
      full_name: fullName,
      job_title: jobTitle,
      phone,
      company_name: companyName,
      industry,
      company_size: companySize,
      website,
      location,
      bio,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // ── Derived billing state ────────────────────────────────────────
  const currentPlanId = profile?.plan_tier || 'scout';
  const currentPlan = getPlanById(currentPlanId);
  const featureAccess = getFeatureAccess(currentPlanId);
  const isOnFreePlan = !profile?.plan || profile.plan === 'free';
  const isTrial = profile?.plan === 'trial';

  // Placeholder usage data (in production, this would come from the backend)
  const usageStats = {
    leadsUsed: currentPlanId === 'command' ? 3420 : currentPlanId === 'scout' ? 654 : currentPlanId === 'closer' ? 2180 : 120,
    agentsActive: currentPlanId === 'command' ? 5 : currentPlanId === 'scout' ? 2 : currentPlanId === 'closer' ? 3 : 1,
    campaignsRunning: currentPlanId === 'command' ? 4 : currentPlanId === 'scout' ? 1 : currentPlanId === 'closer' ? 2 : 1,
  };

  // B2B plans for comparison
  const b2bPlans = PLANS.filter(p => p.track === 'b2b');
  const b2cPlans = PLANS.filter(p => p.track === 'b2c');
  const userTrack = currentPlan?.track || 'b2b';
  const displayPlans = userTrack === 'b2c' ? b2cPlans : b2bPlans;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background noise-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/50 glass px-4">
        <div className="flex items-center gap-3">
          <Link href="/portal">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Portal
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-sm font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-secondary/30 border border-border/30">
            <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Building2 className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Shield className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-border/30 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
                <CardDescription>Update your personal details and profile photo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job title</Label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user.email || ''}
                      disabled
                      className="bg-secondary/20 border-border/30 text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed here. Contact support if needed.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A brief description about yourself"
                    className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : saved ? (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saved ? 'Saved!' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            <Card className="border-border/30 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Company Details</CardTitle>
                <CardDescription>Company information used by AI agents to understand your target market</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company name</Label>
                    <Input
                      id="companyName"
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
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Company Details
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-border/30 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Notification Preferences</CardTitle>
                <CardDescription>Control how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: 'Email Notifications', desc: 'Receive updates via email', value: emailNotifications, setter: setEmailNotifications },
                  { label: 'Push Notifications', desc: 'Browser push notifications for real-time updates', value: pushNotifications, setter: setPushNotifications },
                  { label: 'Campaign Alerts', desc: 'Alert when campaigns complete or need attention', value: campaignAlerts, setter: setCampaignAlerts },
                  { label: 'Lead Alerts', desc: 'Notify when high-value leads are discovered', value: leadAlerts, setter: setLeadAlerts },
                  { label: 'Weekly Report', desc: 'Receive a weekly summary of your lead generation performance', value: weeklyReport, setter: setWeeklyReport },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                    <Switch checked={item.value} onCheckedChange={item.setter} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Account Tab (Enhanced with Billing) ──────────────────── */}
          <TabsContent value="account" className="space-y-6">

            {/* ── Current Plan Card ─────────────────────────────────── */}
            <Card className="border-border/30 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Current Plan</CardTitle>
                <CardDescription>Your subscription and usage details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plan header */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {currentPlan?.displayName || 'Scout'} Plan
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentPlan?.monthlyPrice
                          ? billingCycle === 'annual'
                            ? `$${currentPlan.annualPrice.toLocaleString()}/yr`
                            : `$${currentPlan.monthlyPrice}/mo`
                          : 'Custom pricing'
                        }
                        {isTrial && ' · Trial'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTrial && (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                        <Clock className="h-3 w-3 mr-1" />
                        Trial
                      </Badge>
                    )}
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Active
                    </Badge>
                  </div>
                </div>

                {/* Trial banner */}
                {isTrial && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                    <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                    <div className="text-sm text-amber-300">
                      <span className="font-medium">14-day trial active</span> — Upgrade anytime to keep your data and settings.
                    </div>
                  </div>
                )}

                {/* Usage stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Leads usage */}
                  <div className="p-3 rounded-lg bg-secondary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Target className="h-3 w-3" />
                        Leads
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {usageStats.leadsUsed.toLocaleString()}/{featureAccess.maxLeads === -1 ? '∞' : featureAccess.maxLeads.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={featureAccess.maxLeads === -1 ? 10 : (usageStats.leadsUsed / featureAccess.maxLeads) * 100}
                      className="h-1.5 bg-secondary/30 [&>[data-slot=progress-indicator]]:bg-emerald-500"
                    />
                  </div>

                  {/* Agents usage */}
                  <div className="p-3 rounded-lg bg-secondary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        AI Agents
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {usageStats.agentsActive}/{featureAccess.maxAgents === -1 ? '∞' : featureAccess.maxAgents}
                      </span>
                    </div>
                    <Progress
                      value={featureAccess.maxAgents === -1 ? 10 : (usageStats.agentsActive / featureAccess.maxAgents) * 100}
                      className="h-1.5 bg-secondary/30 [&>[data-slot=progress-indicator]]:bg-emerald-500"
                    />
                  </div>

                  {/* Campaigns usage */}
                  <div className="p-3 rounded-lg bg-secondary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Rocket className="h-3 w-3" />
                        Campaigns
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {usageStats.campaignsRunning}/{featureAccess.maxCampaigns === -1 ? '∞' : featureAccess.maxCampaigns}
                      </span>
                    </div>
                    <Progress
                      value={featureAccess.maxCampaigns === -1 ? 10 : (usageStats.campaignsRunning / featureAccess.maxCampaigns) * 100}
                      className="h-1.5 bg-secondary/30 [&>[data-slot=progress-indicator]]:bg-emerald-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Plan Comparison ───────────────────────────────────── */}
            <Card className="border-border/30 bg-card/80">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base">Compare Plans</CardTitle>
                    <CardDescription>
                      {userTrack === 'b2b' ? 'B2B Lead Generation' : 'B2C Appointment Setting'} plans
                    </CardDescription>
                  </div>
                  {/* Billing Cycle Toggle */}
                  <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-1 border border-border/30">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        billingCycle === 'monthly'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('annual')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                        billingCycle === 'annual'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Annual
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px] px-1 py-0 h-4">
                        Save 17%
                      </Badge>
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {displayPlans.map((plan) => {
                    const isCurrentPlan = plan.id === currentPlanId;
                    const isCustom = plan.monthlyPrice === 0;
                    const price = billingCycle === 'annual'
                      ? plan.annualPrice
                      : plan.monthlyPrice;
                    const isLoading = checkoutLoading === plan.id;

                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-xl border p-4 space-y-3 transition-all ${
                          isCurrentPlan
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : plan.highlight
                              ? 'border-emerald-500/20 bg-card/80 hover:border-emerald-500/30'
                              : 'border-border/30 bg-card/60 hover:border-border/50'
                        }`}
                      >
                        {/* Popular badge */}
                        {plan.badge && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                            <Badge className="bg-emerald-500 text-black border-0 text-[10px] font-bold px-2">
                              {plan.badge}
                            </Badge>
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground text-sm">
                              {plan.displayName}
                            </h3>
                            {isCurrentPlan && (
                              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {plan.description}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-1">
                          {isCustom ? (
                            <span className="text-lg font-bold text-foreground">Custom</span>
                          ) : (
                            <>
                              <span className="text-lg font-bold text-foreground">${price.toLocaleString()}</span>
                              <span className="text-xs text-muted-foreground">
                                /{billingCycle === 'annual' ? 'yr' : 'mo'}
                              </span>
                              {billingCycle === 'annual' && (
                                <span className="text-[10px] text-emerald-400 ml-1">
                                  ${(price / 12).toFixed(0)}/mo
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Key features */}
                        <div className="space-y-1">
                          {plan.features.slice(0, 4).map((feat, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                              {feat}
                            </div>
                          ))}
                          {plan.features.length > 4 && (
                            <div className="text-[10px] text-muted-foreground pl-4">
                              +{plan.features.length - 4} more features
                            </div>
                          )}
                        </div>

                        {/* Action button */}
                        {isCurrentPlan ? (
                          <Button
                            variant="outline"
                            className="w-full border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5 hover:text-emerald-400"
                            disabled
                          >
                            Current Plan
                          </Button>
                        ) : isCustom ? (
                          <Button
                            variant="outline"
                            className="w-full border-border/30 hover:bg-secondary/50 gap-1"
                            onClick={() => {
                              toast.info('Contact Sales', {
                                description: 'Our team will help you set up a custom plan for your needs.',
                                duration: 6000,
                              });
                            }}
                          >
                            Contact Sales
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            className={`w-full font-semibold gap-1 ${
                              plan.highlight
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-black glow-emerald-sm'
                                : 'bg-secondary/50 hover:bg-secondary/70 text-foreground border border-border/30'
                            }`}
                            disabled={isLoading}
                            onClick={() => handleCheckout(plan.id, billingCycle)}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                {isOnFreePlan || isTrial ? 'Start Plan' : 'Change Plan'}
                                <ChevronRight className="h-3 w-3" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ── Billing & Payments ────────────────────────────────── */}
            <Card className="border-border/30 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  Billing & Payments
                </CardTitle>
                <CardDescription>Manage your payment method, invoices, and billing details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subscription status row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                    <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Next billing date</div>
                      <div className="text-sm font-medium text-foreground">
                        {isOnFreePlan
                          ? 'N/A'
                          : isTrial
                            ? `Trial ends ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                    <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CreditCard className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Payment method</div>
                      <div className="text-sm font-medium text-foreground">
                        {isOnFreePlan ? 'No card on file' : '•••• •••• •••• 4242'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing history */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Recent Invoices
                  </h4>
                  {isOnFreePlan ? (
                    <div className="p-4 rounded-lg bg-secondary/10 border border-border/20 text-center">
                      <p className="text-xs text-muted-foreground">No invoices yet. Subscribe to a plan to see your billing history.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {/* Upcoming invoice */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/15 hover:bg-secondary/25 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Clock className="h-3.5 w-3.5 text-amber-400" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-foreground">Upcoming invoice</div>
                            <div className="text-[10px] text-muted-foreground">
                              {currentPlan?.monthlyPrice
                                ? billingCycle === 'annual'
                                  ? `$${currentPlan.annualPrice.toLocaleString()}/yr`
                                  : `$${currentPlan.monthlyPrice}/mo`
                                : 'Custom'
                              }
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-400">
                          Pending
                        </Badge>
                      </div>
                      {/* Last paid invoice */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/15 hover:bg-secondary/25 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-foreground">Last payment</div>
                            <div className="text-[10px] text-muted-foreground">
                              {currentPlan?.monthlyPrice
                                ? `$${currentPlan.monthlyPrice.toLocaleString()}`
                                : 'Custom'
                              } — {new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400">
                          Paid
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Manage Billing button */}
                {!isOnFreePlan && (
                  <Button
                    variant="outline"
                    className="w-full border-border/30 hover:bg-secondary/50 gap-2"
                    disabled={portalLoading}
                    onClick={handlePortal}
                  >
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    Manage Billing Portal
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* ── Plan Feature Details ──────────────────────────────── */}
            <Card className="border-border/30 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Your Plan Includes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {currentPlan?.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground py-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                      {feat}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── Account Actions ───────────────────────────────────── */}
            <Card className="border-border/30 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/forgot-password">
                  <Button variant="outline" className="w-full justify-start gap-2 border-border/30 hover:bg-secondary/50">
                    Change Password
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-red-500/20 text-red-400 hover:bg-red-500/5 hover:text-red-400"
                  onClick={signOut}
                >
                  Sign Out of All Devices
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-500/10 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base text-red-400">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions that affect your account permanently</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/5 hover:text-red-400" disabled>
                  Delete Account
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Account deletion is not available during the trial period. Contact support for assistance.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
