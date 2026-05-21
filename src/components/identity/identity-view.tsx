'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { PortfolioItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  User,
  Building2,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Rocket,
  Star,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Link2,
  Save,
  Image,
  FileText,
  Award,
} from 'lucide-react';

export function IdentityView() {
  const { userProfile, setUserProfile, addPortfolioItem, removePortfolioItem, updatePortfolioItem } = useAppStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<PortfolioItem>>({
    title: '',
    description: '',
    url: '',
    imageUrl: '',
    category: 'project',
  });
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleSave = () => {
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleAddPortfolioItem = () => {
    if (!newItem.title) return;
    const item: PortfolioItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: newItem.title || '',
      description: newItem.description || '',
      url: newItem.url || '',
      imageUrl: newItem.imageUrl || '',
      category: newItem.category || 'project',
    };
    addPortfolioItem(item);
    setNewItem({ title: '', description: '', url: '', imageUrl: '', category: 'project' });
    setPortfolioDialogOpen(false);
  };

  const profileCompleteness = () => {
    const fields = [
      userProfile.fullName,
      userProfile.jobTitle,
      userProfile.email,
      userProfile.bio,
      userProfile.companyName,
      userProfile.companyIndustry,
      userProfile.companyWebsite,
      userProfile.portfolioUrl,
    ];
    const filled = fields.filter((f) => f && f.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completeness = profileCompleteness();

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-violet-500/10 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <Avatar className="h-20 w-20 ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-background">
                <AvatarImage src={userProfile.avatarUrl} alt={userProfile.fullName} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-black text-xl font-bold">
                  {getInitials(userProfile.fullName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {userProfile.fullName || 'Your Identity Profile'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {userProfile.jobTitle
                  ? `${userProfile.jobTitle}${userProfile.companyName ? ` at ${userProfile.companyName}` : ''}`
                  : 'Set up your personal brand, company, and portfolio — all in one place'}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{completeness}% complete</span>
                </div>
                {userProfile.companyName && (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                    <Building2 className="h-3 w-3 mr-1" />
                    {userProfile.companyName}
                  </Badge>
                )}
                {userProfile.portfolioUrl && (
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                    <Globe className="h-3 w-3 mr-1" />
                    Portfolio Live
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspirational Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/80 card-premium group">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-violet-500/30 group-hover:to-purple-500/30 transition-all">
              <Star className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Personal Brand</p>
              <p className="text-lg font-semibold">
                {userProfile.fullName ? 'Active' : 'Not Set'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 card-premium group">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-all">
              <Rocket className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="text-lg font-semibold">
                {userProfile.companyName || 'Not Set'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 card-premium group">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all">
              <Globe className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Portfolio</p>
              <p className="text-lg font-semibold">
                {userProfile.portfolioItems.length > 0
                  ? `${userProfile.portfolioItems.length} item${userProfile.portfolioItems.length !== 1 ? 's' : ''}`
                  : 'No Items'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50 p-1 rounded-xl">
          <TabsTrigger value="personal" className="rounded-lg gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <User className="h-4 w-4" />
            Personal Identity
          </TabsTrigger>
          <TabsTrigger value="company" className="rounded-lg gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="rounded-lg gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Globe className="h-4 w-4" />
            Portfolio
          </TabsTrigger>
        </TabsList>

        {/* Personal Identity Tab */}
        <TabsContent value="personal" className="space-y-6">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-violet-400" />
                Your Personal Identity
              </CardTitle>
              <CardDescription>
                Define who you are, your professional identity, and how you present yourself to the world. This information powers your outreach personalization and brand presence across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar + Name Row */}
              <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 items-start">
                <div className="space-y-2">
                  <Label>Profile Photo</Label>
                  <div className="relative group">
                    <Avatar className="h-24 w-24 ring-2 ring-border/50 ring-offset-2 ring-offset-background">
                      <AvatarImage src={userProfile.avatarUrl} alt={userProfile.fullName} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-black text-2xl font-bold">
                        {getInitials(userProfile.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Image className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <Input
                    placeholder="Photo URL..."
                    value={userProfile.avatarUrl}
                    onChange={(e) => setUserProfile({ avatarUrl: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Full Name
                    </Label>
                    <Input
                      placeholder="John Doe"
                      value={userProfile.fullName}
                      onChange={(e) => setUserProfile({ fullName: e.target.value })}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      Job Title
                    </Label>
                    <Input
                      placeholder="CEO & Founder"
                      value={userProfile.jobTitle}
                      onChange={(e) => setUserProfile({ jobTitle: e.target.value })}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      placeholder="john@company.com"
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ email: e.target.value })}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Phone
                    </Label>
                    <Input
                      placeholder="+1 (555) 000-0000"
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile({ phone: e.target.value })}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Location
                    </Label>
                    <Input
                      placeholder="San Francisco, CA"
                      value={userProfile.location}
                      onChange={(e) => setUserProfile({ location: e.target.value })}
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Bio */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Professional Bio
                </Label>
                <Textarea
                  placeholder="Tell the world about your expertise, passion, and what drives you. This bio powers your outreach personalization and helps prospects understand your value proposition..."
                  value={userProfile.bio}
                  onChange={(e) => setUserProfile({ bio: e.target.value })}
                  className="min-h-[120px] bg-secondary/30 border-border/50 focus:border-emerald-500/30 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {userProfile.bio.length}/500 characters recommended for optimal outreach personalization
                </p>
              </div>

              <Separator className="bg-border/30" />

              {/* Social Links */}
              <div className="space-y-4">
                <Label className="flex items-center gap-1.5 text-base">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  Social Presence
                </Label>
                <p className="text-sm text-muted-foreground -mt-2">
                  Connect your professional social profiles to strengthen your identity and enable enriched outreach signals.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Linkedin className="h-3.5 w-3.5 text-blue-400" />
                      LinkedIn
                    </Label>
                    <Input
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={userProfile.socialLinks.linkedin}
                      onChange={(e) =>
                        setUserProfile({
                          socialLinks: { ...userProfile.socialLinks, linkedin: e.target.value },
                        })
                      }
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Twitter className="h-3.5 w-3.5 text-sky-400" />
                      Twitter / X
                    </Label>
                    <Input
                      placeholder="https://x.com/yourhandle"
                      value={userProfile.socialLinks.twitter}
                      onChange={(e) =>
                        setUserProfile({
                          socialLinks: { ...userProfile.socialLinks, twitter: e.target.value },
                        })
                      }
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Github className="h-3.5 w-3.5 text-foreground/70" />
                      GitHub
                    </Label>
                    <Input
                      placeholder="https://github.com/yourusername"
                      value={userProfile.socialLinks.github}
                      onChange={(e) =>
                        setUserProfile({
                          socialLinks: { ...userProfile.socialLinks, github: e.target.value },
                        })
                      }
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Globe className="h-3.5 w-3.5 text-emerald-400" />
                      Personal Website
                    </Label>
                    <Input
                      placeholder="https://yourwebsite.com"
                      value={userProfile.socialLinks.website}
                      onChange={(e) =>
                        setUserProfile({
                          socialLinks: { ...userProfile.socialLinks, website: e.target.value },
                        })
                      }
                      className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-emerald-400" />
                Your Company
              </CardTitle>
              <CardDescription>
                Define your company identity to power targeted outreach campaigns. Your company profile helps LeadReach AI match you with ideal prospects and craft messaging that reflects your brand positioning and market focus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Company Name
                  </Label>
                  <Input
                    placeholder="Acme Inc."
                    value={userProfile.companyName}
                    onChange={(e) => setUserProfile({ companyName: e.target.value })}
                    className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-muted-foreground" />
                    Your Role at Company
                  </Label>
                  <Input
                    placeholder="Co-Founder & CTO"
                    value={userProfile.companyRole}
                    onChange={(e) => setUserProfile({ companyRole: e.target.value })}
                    className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select
                    value={userProfile.companyIndustry}
                    onValueChange={(value) => setUserProfile({ companyIndustry: value })}
                  >
                    <SelectTrigger className="bg-secondary/30 border-border/50 focus:border-emerald-500/30">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Accounting', 'Advertising', 'Aerospace', 'Agriculture', 'Automotive', 'Banking', 'Biotechnology', 'Construction', 'Consulting', 'Education', 'Energy', 'Engineering', 'Finance', 'Food & Beverage', 'Healthcare', 'Hospitality', 'Insurance', 'Legal', 'Manufacturing', 'Marketing', 'Media', 'Pharmaceuticals', 'Real Estate', 'Retail', 'Technology', 'Telecommunications', 'Transportation', 'Travel', 'Utilities'].map(
                        (ind) => (
                          <SelectItem key={ind} value={ind}>
                            {ind}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <Select
                    value={userProfile.companySize}
                    onValueChange={(value) => setUserProfile({ companySize: value })}
                  >
                    <SelectTrigger className="bg-secondary/30 border-border/50 focus:border-emerald-500/30">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'].map(
                        (size) => (
                          <SelectItem key={size} value={size}>
                            {size} employees
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    Company Website
                  </Label>
                  <Input
                    placeholder="https://acme.com"
                    value={userProfile.companyWebsite}
                    onChange={(e) => setUserProfile({ companyWebsite: e.target.value })}
                    className="bg-secondary/30 border-border/50 focus:border-emerald-500/30"
                  />
                </div>
              </div>

              <Separator className="bg-border/30" />

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Company Description
                </Label>
                <Textarea
                  placeholder="Describe what your company does, your value proposition, target market, and what sets you apart. This powers AI-generated outreach that authentically represents your brand..."
                  value={userProfile.companyDescription}
                  onChange={(e) => setUserProfile({ companyDescription: e.target.value })}
                  className="min-h-[120px] bg-secondary/30 border-border/50 focus:border-emerald-500/30 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  A detailed description helps LeadReach AI craft outreach that authentically represents your brand
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="h-5 w-5 text-cyan-400" />
                    Portfolio & Showcase
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    Showcase your products, projects, case studies, or any work that defines your professional identity. Your portfolio enriches outreach with credibility signals and gives prospects a direct path to understanding your value.
                  </CardDescription>
                </div>
                <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-semibold"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-card border-border/60">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-cyan-400" />
                        Add Portfolio Item
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="Project or product name"
                          value={newItem.title}
                          onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                          className="bg-secondary/30 border-border/50 focus:border-cyan-500/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Brief description of this work..."
                          value={newItem.description}
                          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                          className="bg-secondary/30 border-border/50 focus:border-cyan-500/30 resize-none min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          placeholder="https://..."
                          value={newItem.url}
                          onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                          className="bg-secondary/30 border-border/50 focus:border-cyan-500/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Image URL (optional)</Label>
                        <Input
                          placeholder="https://...image.png"
                          value={newItem.imageUrl}
                          onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                          className="bg-secondary/30 border-border/50 focus:border-cyan-500/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={newItem.category}
                          onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                        >
                          <SelectTrigger className="bg-secondary/30 border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="project">Project</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="case-study">Case Study</SelectItem>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="certification">Certification</SelectItem>
                            <SelectItem value="award">Award</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleAddPortfolioItem}
                        disabled={!newItem.title}
                        className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-semibold"
                      >
                        Add to Portfolio
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Portfolio Website URL */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-cyan-400" />
                  Portfolio Website URL
                </Label>
                <Input
                  placeholder="https://yourportfolio.dev or https://yourcompany.com/showcase"
                  value={userProfile.portfolioUrl}
                  onChange={(e) => setUserProfile({ portfolioUrl: e.target.value })}
                  className="bg-secondary/30 border-border/50 focus:border-cyan-500/30"
                />
                <p className="text-xs text-muted-foreground">
                  Your main portfolio or product showcase website — this link will be included in your outreach signatures
                </p>
              </div>

              <Separator className="bg-border/30" />

              {/* Portfolio Items Grid */}
              {userProfile.portfolioItems.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 flex items-center justify-center">
                    <Globe className="h-8 w-8 text-cyan-400/50" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground/80">No portfolio items yet</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                      Add your products, projects, case studies, or certifications to build a compelling professional showcase that strengthens your outreach credibility.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-400"
                    onClick={() => setPortfolioDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Item
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userProfile.portfolioItems.map((item) => (
                    <Card
                      key={item.id}
                      className="border-border/50 bg-secondary/20 card-premium group relative overflow-hidden"
                    >
                      {item.imageUrl && (
                        <div className="h-32 w-full bg-secondary/50 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                          />
                        </div>
                      )}
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.title}</h4>
                            <Badge
                              variant="outline"
                              className="mt-1 text-[10px] border-cyan-500/20 text-cyan-400 capitalize"
                            >
                              {item.category.replace('-', ' ')}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removePortfolioItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex items-center justify-between py-4">
        <p className="text-sm text-muted-foreground">
          Your identity profile powers personalized outreach and strengthens your brand across all campaigns.
        </p>
        <Button
          onClick={handleSave}
          className={`gap-2 font-semibold transition-all duration-300 ${
            saveFeedback
              ? 'bg-emerald-500 text-black'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black'
          }`}
        >
          {saveFeedback ? (
            <>
              <Sparkles className="h-4 w-4" />
              Profile Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
