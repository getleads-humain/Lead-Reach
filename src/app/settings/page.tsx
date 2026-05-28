'use client';

/**
 * LeadReach — User Settings Page
 * ================================
 * Profile management, notification preferences, plan info, and account settings.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import Link from 'next/link';
import { INDUSTRIES, COMPANY_SIZES } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, updateProfile, signOut, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="border-border/30 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Current Plan</CardTitle>
                <CardDescription>Your subscription and usage details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground capitalize">{profile?.plan_tier || 'Scout'} Plan</div>
                      <div className="text-xs text-muted-foreground">B2B Lead Generation</div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Active
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-secondary/20">
                    <div className="text-lg font-bold text-foreground">{profile?.plan === 'free' ? '14' : '30'}</div>
                    <div className="text-xs text-muted-foreground">Days Left</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/20">
                    <div className="text-lg font-bold text-foreground">1,000</div>
                    <div className="text-xs text-muted-foreground">Leads Limit</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/20">
                    <div className="text-lg font-bold text-foreground">3</div>
                    <div className="text-xs text-muted-foreground">AI Agents</div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
