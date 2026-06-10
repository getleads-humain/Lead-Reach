'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  MapPin,
  Star,
  Phone,
  Globe,
  Mail,
  ChevronDown,
  ChevronUp,
  Loader2,
  Download,
  FileJson,
  FileSpreadsheet,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Zap,
  ShieldCheck,
  Clock,
  Map,
  ExternalLink,
  Plus,
  Radar,
  AlertCircle,
  X,
  CheckCircle2,
  DollarSign,
  Users,
  Building2,
  Navigation,
  Target,
  Layers,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface CompleteAddress {
  borough: string;
  street: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
}

interface UserReview {
  name: string;
  rating: number;
  description: string;
  when: string;
  replyText?: string;
}

interface AboutSection {
  id: string;
  name: string;
  options: Array<{ name: string; enabled: boolean }>;
}

interface ImageItem {
  title: string;
  image: string;
}

interface ReservationLink {
  link: string;
  source: string;
}

interface OrderOnlineLink {
  link: string;
  source: string;
}

interface MenuLink {
  link: string;
  source: string;
}

interface OwnerInfo {
  id: string;
  name: string;
  link: string;
}

interface GoogleMapsEntry {
  inputId: string;
  link: string;
  title: string;
  category: string;
  categories: string[];
  description: string;
  status: string;
  phone: string;
  website: string;
  emails: string[];
  address: string;
  completeAddress: CompleteAddress;
  latitude: number;
  longitude: number;
  plusCode: string;
  timezone: string;
  reviewCount: number;
  reviewRating: number;
  reviewsPerRating: Record<number, number>;
  reviewsLink: string;
  userReviews: UserReview[];
  openHours: Record<string, string[]>;
  popularTimes: Record<string, Record<number, number>>;
  priceRange: string;
  about: AboutSection[];
  thumbnail: string;
  images: ImageItem[];
  reservations: ReservationLink[];
  orderOnline: OrderOnlineLink[];
  menu: MenuLink;
  cid: string;
  dataId: string;
  placeId: string;
  owner: OwnerInfo;
}

interface SearchMeta {
  query: string;
  language: string;
  maxDepth: number;
  maxResults: number;
  fastMode: boolean;
  extractEmails: boolean;
  extractReviews: boolean;
  elapsedMs: number;
  source: string;
}

interface SearchResponse {
  success: boolean;
  results: GoogleMapsEntry[];
  total: number;
  meta: SearchMeta;
  error?: string;
  message?: string;
}

interface SearchParams {
  query: string;
  language: string;
  maxResults: number;
  maxDepth: number;
  extractEmails: boolean;
  extractReviews: boolean;
  fastMode: boolean;
  geoCoordinates?: string;
  radius?: number;
  gridSearch?: {
    boundingBox: { minLat: number; minLon: number; maxLat: number; maxLon: number };
    cellSizeKm: number;
  };
}

type ViewMode = 'grid' | 'list';
type SortField = 'rating' | 'reviews' | 'name' | 'distance';
type SortDirection = 'asc' | 'desc';

// ============================================================
// Constants
// ============================================================

const QUICK_FILTERS = [
  { label: 'Restaurants', query: 'restaurants near me' },
  { label: 'Marketing Agencies', query: 'marketing agencies' },
  { label: 'SaaS Companies', query: 'SaaS companies' },
  { label: 'Real Estate', query: 'real estate agencies' },
  { label: 'Healthcare', query: 'healthcare clinics' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ============================================================
// Helper Functions
// ============================================================

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function getStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'OPERATIONAL':
    case 'OPEN':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'CLOSED':
    case 'CLOSED_TEMPORARILY':
    case 'TEMPORARILY CLOSED':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'PERMANENTLY CLOSED':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    default:
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }
}

function getPriceIndicator(priceRange: string): React.ReactNode {
  if (!priceRange) return null;
  const count = (priceRange.match(/\$/g) || []).length;
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <DollarSign key={i} className="h-3 w-3 text-emerald-400" />
      ))}
      {Array.from({ length: Math.max(0, 4 - count) }).map((_, i) => (
        <DollarSign key={`e-${i}`} className="h-3 w-3 text-muted-foreground/20" />
      ))}
    </span>
  );
}

function renderStars(rating: number): React.ReactNode {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`f-${i}`} className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
      ))}
      {hasHalf && (
        <span className="relative inline-flex">
          <Star className="h-3.5 w-3.5 text-muted-foreground/30" />
          <span className="absolute inset-0 overflow-hidden w-[50%]">
            <Star className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
          </span>
        </span>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`e-${i}`} className="h-3.5 w-3.5 text-muted-foreground/30" />
      ))}
    </span>
  );
}

// ============================================================
// Sub-Components
// ============================================================

function QuickFilterPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium border border-border/40 bg-secondary/30 text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 whitespace-nowrap"
    >
      {label}
    </button>
  );
}

function ResultSkeleton() {
  return (
    <Card className="border-border/30 bg-card/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-2xl bg-emerald-500/5 p-6 mb-4 border border-emerald-500/10">
        <Map className="h-10 w-10 text-emerald-400/60" />
      </div>
      <h3 className="text-lg font-semibold text-foreground/80 mb-1">Search Google Maps</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Find businesses, extract contact details, and discover leads from Google Maps data.
        Try &ldquo;marketing agencies in Austin, TX&rdquo;
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const isPuppeteerError =
    message.toLowerCase().includes('puppeteer') ||
    message.toLowerCase().includes('browser') ||
    message.toLowerCase().includes('chrome') ||
    message.toLowerCase().includes('launch');

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-2xl bg-red-500/5 p-6 mb-4 border border-red-500/10">
        <AlertCircle className="h-10 w-10 text-red-400/60" />
      </div>
      <h3 className="text-lg font-semibold text-foreground/80 mb-2">Search Failed</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-1">{message}</p>
      {isPuppeteerError && (
        <p className="text-xs text-amber-400/80 max-w-md mt-2 mb-4">
          The browser automation service may not be available. Please ensure the browser service is running and try again.
        </p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-3 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry Search
        </Button>
      )}
    </div>
  );
}

// ============================================================
// Business Result Card
// ============================================================

function BusinessResultCard({
  entry,
  viewMode,
  onAddToLeads,
  onDeepScan,
  isAddingLead,
  isScanning,
}: {
  entry: GoogleMapsEntry;
  viewMode: ViewMode;
  onAddToLeads: (entry: GoogleMapsEntry) => void;
  onDeepScan: (entry: GoogleMapsEntry) => void;
  isAddingLead: boolean;
  isScanning: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-3 rounded-lg border border-border/30 bg-card/50 hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] transition-all duration-200">
        {/* Thumbnail */}
        {entry.thumbnail ? (
          <img
            src={entry.thumbnail}
            alt={entry.title}
            className="h-10 w-10 rounded-md object-cover shrink-0 border border-border/30"
          />
        ) : (
          <div className="h-10 w-10 rounded-md bg-secondary/40 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-muted-foreground/40" />
          </div>
        )}

        {/* Name + Category */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground/90 truncate">{entry.title}</span>
            <Badge variant="outline" className={getStatusColor(entry.status)}>
              {entry.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{entry.category}</p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 shrink-0">
          {renderStars(entry.reviewRating)}
          <span className="text-xs text-foreground/80 font-medium">{entry.reviewRating?.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({entry.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="shrink-0 w-20">{getPriceIndicator(entry.priceRange)}</div>

        {/* Phone */}
        <div className="shrink-0 w-28">
          {entry.phone ? (
            <span className="text-xs text-foreground/80 truncate">{entry.phone}</span>
          ) : (
            <span className="text-xs text-muted-foreground/40">—</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                  onClick={() => onAddToLeads(entry)}
                  disabled={isAddingLead}
                >
                  {isAddingLead ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add to Leads</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                  onClick={() => onDeepScan(entry)}
                  disabled={isScanning}
                >
                  {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Radar className="h-3 w-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deep Scan</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <Card className="border-border/30 bg-card/50 card-premium group">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {entry.thumbnail ? (
            <img
              src={entry.thumbnail}
              alt={entry.title}
              className="h-14 w-14 rounded-lg object-cover shrink-0 border border-border/30"
            />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-secondary/40 flex items-center justify-center shrink-0 border border-border/30">
              <Building2 className="h-6 w-6 text-muted-foreground/30" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-foreground/90 truncate">{entry.title}</h4>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant="outline" className="text-[9px] bg-emerald-500/5 text-emerald-400 border-emerald-500/20">
                    {entry.category}
                  </Badge>
                  <Badge variant="outline" className={`text-[9px] ${getStatusColor(entry.status)}`}>
                    {entry.status}
                  </Badge>
                  {entry.priceRange && (
                    <span className="inline-flex">{getPriceIndicator(entry.priceRange)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-2.5">
          {renderStars(entry.reviewRating)}
          <span className="text-xs font-semibold text-foreground/80">{entry.reviewRating?.toFixed(1) || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">({entry.reviewCount || 0} reviews)</span>
        </div>

        {/* Contact Info */}
        <div className="space-y-1.5 mb-3">
          {entry.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
              <span className="text-xs text-muted-foreground line-clamp-2">{entry.address}</span>
            </div>
          )}
          {entry.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <a href={`tel:${entry.phone}`} className="text-xs text-emerald-400/80 hover:text-emerald-300 transition-colors">
                {entry.phone}
              </a>
            </div>
          )}
          {entry.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <a
                href={entry.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400/80 hover:text-cyan-300 truncate transition-colors"
              >
                {entry.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink className="h-2.5 w-2.5 inline ml-0.5" />
              </a>
            </div>
          )}
          {entry.emails && entry.emails.length > 0 && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-emerald-400/60 shrink-0" />
              <span className="text-xs text-emerald-400">{entry.emails[0]}</span>
              {entry.emails.length > 1 && (
                <Badge variant="outline" className="text-[8px] h-4 px-1 bg-emerald-500/5 text-emerald-400 border-emerald-500/20">
                  +{entry.emails.length - 1}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {entry.description && (
          <p className="text-xs text-muted-foreground/70 line-clamp-2 mb-3">{entry.description}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            size="sm"
            className="h-7 text-[10px] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-1.5 transition-all"
            onClick={() => onAddToLeads(entry)}
            disabled={isAddingLead}
          >
            {isAddingLead ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Add to Leads
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 gap-1.5 transition-all"
            onClick={() => onDeepScan(entry)}
            disabled={isScanning}
          >
            {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Radar className="h-3 w-3" />}
            Deep Scan
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] text-muted-foreground hover:text-foreground gap-1 ml-auto"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Less' : 'Details'}
          </Button>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/20 space-y-3">
            {/* Hours */}
            {entry.openHours && Object.keys(entry.openHours).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Hours</span>
                </div>
                <div className="space-y-0.5 pl-5">
                  {Object.entries(entry.openHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground/60">{day}</span>
                      <span className="text-[10px] text-foreground/70">{(hours as string[]).join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {entry.userReviews && entry.userReviews.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Star className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Reviews</span>
                </div>
                <div className="space-y-2 pl-5">
                  {entry.userReviews.slice(0, 3).map((review, i) => (
                    <div key={i} className="rounded-md bg-secondary/20 p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-foreground/80">{review.name}</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: review.rating }).map((_, j) => (
                            <Star key={j} className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400" />
                          ))}
                        </div>
                        <span className="text-[9px] text-muted-foreground/50">{review.when}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 line-clamp-2">{review.description}</p>
                      {review.replyText && (
                        <div className="mt-1 pl-2 border-l border-border/20">
                          <p className="text-[9px] text-muted-foreground/50 italic line-clamp-1">Owner: {review.replyText}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {entry.userReviews.length > 3 && (
                    <a
                      href={entry.reviewsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-cyan-400/70 hover:text-cyan-400 transition-colors"
                    >
                      View all {entry.reviewCount} reviews →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* About Section */}
            {entry.about && entry.about.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">About</span>
                </div>
                <div className="space-y-1.5 pl-5">
                  {entry.about.map((section) => (
                    <div key={section.id}>
                      <span className="text-[10px] font-medium text-foreground/70">{section.name}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {section.options.map((opt) => (
                          <Badge
                            key={opt.name}
                            variant="outline"
                            className={`text-[8px] h-4 px-1 ${
                              opt.enabled
                                ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                : 'bg-secondary/20 text-muted-foreground/40 border-border/20'
                            }`}
                          >
                            {opt.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coordinates */}
            {entry.latitude && entry.longitude && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Navigation className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-[10px] text-cyan-400">
                    {entry.latitude.toFixed(6)}, {entry.longitude.toFixed(6)}
                  </span>
                </div>
                {entry.plusCode && (
                  <p className="text-[10px] text-muted-foreground/40 pl-5">Plus Code: {entry.plusCode}</p>
                )}
                {entry.timezone && (
                  <p className="text-[10px] text-muted-foreground/40 pl-5">Timezone: {entry.timezone}</p>
                )}
              </div>
            )}

            {/* Complete Address */}
            {entry.completeAddress && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[10px] text-foreground/70">
                    {[entry.completeAddress.street, entry.completeAddress.city, entry.completeAddress.state, entry.completeAddress.postalCode, entry.completeAddress.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Additional Links */}
            <div className="flex flex-wrap gap-2">
              {entry.link && (
                <a
                  href={entry.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-cyan-400/70 hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  Google Maps
                </a>
              )}
              {entry.reservations && entry.reservations.length > 0 && entry.reservations.map((r, i) => (
                <a
                  key={i}
                  href={r.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-emerald-400/70 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <Calendar className="h-2.5 w-2.5" />
                  Reserve ({r.source})
                </a>
              ))}
              {entry.orderOnline && entry.orderOnline.length > 0 && entry.orderOnline.map((o, i) => (
                <a
                  key={i}
                  href={o.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors inline-flex items-center gap-1"
                >
                  <Globe className="h-2.5 w-2.5" />
                  Order ({o.source})
                </a>
              ))}
              {entry.menu?.link && (
                <a
                  href={entry.menu.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-violet-400/70 hover:text-violet-400 transition-colors inline-flex items-center gap-1"
                >
                  <Layers className="h-2.5 w-2.5" />
                  Menu
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================

export function GoogleMapsSearch() {
  // Search State
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GoogleMapsEntry[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search Parameters
  const [language, setLanguage] = useState('en');
  const [maxResults, setMaxResults] = useState(20);
  const [maxDepth, setMaxDepth] = useState(5);
  const [fastMode, setFastMode] = useState(false);
  const [extractEmails, setExtractEmails] = useState(true);
  const [extractReviews, setExtractReviews] = useState(false);
  const [geoCoordinates, setGeoCoordinates] = useState('');
  const [radius, setRadius] = useState(10000);

  // Grid Search
  const [gridSearchEnabled, setGridSearchEnabled] = useState(false);
  const [gridMinLat, setGridMinLat] = useState('');
  const [gridMinLon, setGridMinLon] = useState('');
  const [gridMaxLat, setGridMaxLat] = useState('');
  const [gridMaxLon, setGridMaxLon] = useState('');
  const [gridCellSizeKm, setGridCellSizeKm] = useState('5');

  // UI State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('rating');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Execute Search
  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q || isSearching) return;

    setIsSearching(true);
    setError(null);
    setResults([]);
    setMeta(null);

    try {
      const params: SearchParams = {
        query: q,
        language,
        maxResults,
        maxDepth,
        extractEmails,
        extractReviews,
        fastMode,
      };

      if (geoCoordinates) {
        const parts = geoCoordinates.split(',').map((s) => s.trim());
        if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
          params.geoCoordinates = geoCoordinates;
        }
      }

      if (radius && radius !== 10000) {
        params.radius = radius;
      }

      if (gridSearchEnabled && gridMinLat && gridMinLon && gridMaxLat && gridMaxLon) {
        params.gridSearch = {
          boundingBox: {
            minLat: Number(gridMinLat),
            minLon: Number(gridMinLon),
            maxLat: Number(gridMaxLat),
            maxLon: Number(gridMaxLon),
          },
          cellSizeKm: Number(gridCellSizeKm) || 5,
        };
      }

      const response = await fetch('/api/google-maps/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data: SearchResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || data.message || 'Search failed. Please try again.');
        return;
      }

      setResults(data.results || []);
      setMeta(data.meta || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error. Please check your connection and try again.';
      setError(message);
    } finally {
      setIsSearching(false);
    }
  }, [query, language, maxResults, maxDepth, extractEmails, extractReviews, fastMode, geoCoordinates, radius, gridSearchEnabled, gridMinLat, gridMinLon, gridMaxLat, gridMaxLon, gridCellSizeKm, isSearching]);

  // Add to Leads
  const handleAddToLeads = useCallback(async (entry: GoogleMapsEntry) => {
    const key = `lead-${entry.placeId || entry.inputId}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: entry.title,
          website: entry.website || null,
          phoneMain: entry.phone || null,
          generalEmail: entry.emails?.[0] || null,
          hqAddress: entry.address || null,
          city: entry.completeAddress?.city || null,
          stateProvince: entry.completeAddress?.state || null,
          country: entry.completeAddress?.country || null,
          industry: entry.category || null,
          source: 'google_maps',
          sourceData: entry,
        }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: `${entry.title} added to leads` });
      } else {
        const data = await response.json().catch(() => ({}));
        setNotification({ type: 'error', message: data.error || 'Failed to add lead' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to add lead' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  }, []);

  // Deep Scan
  const handleDeepScan = useCallback((entry: GoogleMapsEntry) => {
    const key = `scan-${entry.placeId || entry.inputId}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    // Navigate to prospect discovery or trigger a deep scan
    setNotification({ type: 'success', message: `Deep scan initiated for ${entry.title}` });
    setTimeout(() => {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  }, []);

  // Export
  const handleExportCSV = useCallback(() => {
    if (results.length === 0) return;

    const headers = [
      'Title', 'Category', 'Status', 'Rating', 'Review Count', 'Phone', 'Website',
      'Emails', 'Address', 'City', 'State', 'Country', 'Postal Code', 'Latitude',
      'Longitude', 'Price Range', 'Description',
    ];

    const rows = results.map((entry) => [
      `"${(entry.title || '').replace(/"/g, '""')}"`,
      `"${(entry.category || '').replace(/"/g, '""')}"`,
      entry.status || '',
      entry.reviewRating?.toString() || '',
      entry.reviewCount?.toString() || '',
      entry.phone || '',
      entry.website || '',
      `"${(entry.emails || []).join('; ').replace(/"/g, '""')}"`,
      `"${(entry.address || '').replace(/"/g, '""')}"`,
      entry.completeAddress?.city || '',
      entry.completeAddress?.state || '',
      entry.completeAddress?.country || '',
      entry.completeAddress?.postalCode || '',
      entry.latitude?.toString() || '',
      entry.longitude?.toString() || '',
      entry.priceRange || '',
      `"${(entry.description || '').replace(/"/g, '""')}"`,
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-maps-search-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const handleExportJSON = useCallback(() => {
    if (results.length === 0) return;

    const json = JSON.stringify({ results, meta, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-maps-search-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, meta]);

  // Sort results
  const sortedResults = React.useMemo(() => {
    const sorted = [...results];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'rating':
          cmp = (b.reviewRating || 0) - (a.reviewRating || 0);
          break;
        case 'reviews':
          cmp = (b.reviewCount || 0) - (a.reviewCount || 0);
          break;
        case 'name':
          cmp = (a.title || '').localeCompare(b.title || '');
          break;
        case 'distance':
          cmp = 0; // No distance without user location
          break;
      }
      return sortDirection === 'asc' ? -cmp : cmp;
    });
    return sorted;
  }, [results, sortField, sortDirection]);

  // Unique categories from results for filtering
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    results.forEach((r) => {
      if (r.category) cats.add(r.category);
      r.categories?.forEach((c) => cats.add(c));
    });
    return Array.from(cats).sort();
  }, [results]);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const filteredResults = React.useMemo(() => {
    if (filterCategory === 'all') return sortedResults;
    return sortedResults.filter(
      (r) => r.category === filterCategory || r.categories?.includes(filterCategory)
    );
  }, [sortedResults, filterCategory]);

  // Stats from results
  const resultStats = React.useMemo(() => {
    if (results.length === 0) return null;
    const withEmail = results.filter((r) => r.emails && r.emails.length > 0).length;
    const withPhone = results.filter((r) => r.phone).length;
    const withWebsite = results.filter((r) => r.website).length;
    const avgRating = results.reduce((s, r) => s + (r.reviewRating || 0), 0) / results.length;
    return { withEmail, withPhone, withWebsite, avgRating: avgRating.toFixed(1) };
  }, [results]);

  return (
    <div className="space-y-4">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-lg transition-all duration-300 animate-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-500/10 p-2 border border-emerald-500/20">
              <Map className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground/90">Google Maps Search</h2>
              <p className="text-xs text-muted-foreground">Find businesses, extract contacts, discover leads</p>
            </div>
          </div>
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-border/40 hover:border-emerald-500/30 gap-1.5"
              onClick={handleExportCSV}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-border/40 hover:border-emerald-500/30 gap-1.5"
              onClick={handleExportJSON}
            >
              <FileJson className="h-3.5 w-3.5" />
              JSON
            </Button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <Card className="border-border/30 glass overflow-hidden">
        <CardContent className="p-4">
          {/* Main Search Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder="Search businesses on Google Maps (e.g., 'marketing agencies in Austin, TX')"
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-input/50 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={isSearching || !query.trim()}
              className="h-10 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold gap-2 shadow-lg shadow-emerald-500/20 transition-all duration-200 disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
                </>
              )}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 border-border/40 shrink-0"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <SlidersHorizontal className={`h-4 w-4 transition-transform duration-200 ${showAdvanced ? 'text-emerald-400 rotate-90' : 'text-muted-foreground'}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Advanced Options</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider shrink-0 mr-1">Quick:</span>
            {QUICK_FILTERS.map((filter) => (
              <QuickFilterPill
                key={filter.label}
                label={filter.label}
                onClick={() => {
                  setQuery(filter.query);
                  handleSearch(filter.query);
                }}
              />
            ))}
          </div>

          {/* Advanced Options Panel */}
          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-border/20 space-y-4 animate-in slide-in-from-top-1 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Language */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Language</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Max Results */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Max Results</label>
                    <span className="text-xs font-semibold text-emerald-400">{maxResults}</span>
                  </div>
                  <Slider
                    value={[maxResults]}
                    onValueChange={(v) => setMaxResults(v[0])}
                    min={10}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground/30">
                    <span>10</span>
                    <span>500</span>
                  </div>
                </div>

                {/* Depth */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Depth</label>
                    <span className="text-xs font-semibold text-emerald-400">{maxDepth}</span>
                  </div>
                  <Slider
                    value={[maxDepth]}
                    onValueChange={(v) => setMaxDepth(v[0])}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground/30">
                    <span>1 (shallow)</span>
                    <span>50 (deep)</span>
                  </div>
                </div>

                {/* Radius */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Radius</label>
                    <span className="text-xs font-semibold text-emerald-400">{(radius / 1000).toFixed(0)}km</span>
                  </div>
                  <Slider
                    value={[radius]}
                    onValueChange={(v) => setRadius(v[0])}
                    min={100}
                    max={50000}
                    step={500}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground/30">
                    <span>100m</span>
                    <span>50km</span>
                  </div>
                </div>
              </div>

              {/* Toggles Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Fast Mode */}
                <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/15 p-3">
                  <div className="flex items-center gap-2.5">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-medium text-foreground/80">Fast Mode</span>
                      <p className="text-[9px] text-muted-foreground/50">Reduced data, faster search</p>
                    </div>
                  </div>
                  <Switch checked={fastMode} onCheckedChange={setFastMode} />
                </div>

                {/* Extract Emails */}
                <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/15 p-3">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-medium text-foreground/80">Extract Emails</span>
                      <p className="text-[9px] text-muted-foreground/50">Visit websites for emails</p>
                    </div>
                  </div>
                  <Switch checked={extractEmails} onCheckedChange={setExtractEmails} />
                </div>

                {/* Extract Reviews */}
                <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/15 p-3">
                  <div className="flex items-center gap-2.5">
                    <Star className="h-4 w-4 text-violet-400" />
                    <div>
                      <span className="text-xs font-medium text-foreground/80">Extract Reviews</span>
                      <p className="text-[9px] text-muted-foreground/50">Pull customer reviews</p>
                    </div>
                  </div>
                  <Switch checked={extractReviews} onCheckedChange={setExtractReviews} />
                </div>
              </div>

              {/* Geo Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Geo Coordinates (lat,lng)</label>
                  <Input
                    value={geoCoordinates}
                    onChange={(e) => setGeoCoordinates(e.target.value)}
                    placeholder="e.g., 30.2672,-97.7431"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Center Point Radius</label>
                  <Input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    placeholder="meters (e.g., 10000)"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Grid Search */}
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/15 p-3">
                  <div className="flex items-center gap-2.5">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <div>
                      <span className="text-xs font-medium text-foreground/80">Grid Search</span>
                      <p className="text-[9px] text-muted-foreground/50">Divide area into grid cells for comprehensive coverage</p>
                    </div>
                  </div>
                  <Switch checked={gridSearchEnabled} onCheckedChange={setGridSearchEnabled} />
                </div>

                {gridSearchEnabled && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pl-2 animate-in slide-in-from-top-1 duration-200">
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground/50 uppercase">Min Lat</label>
                      <Input
                        type="number"
                        step="0.001"
                        value={gridMinLat}
                        onChange={(e) => setGridMinLat(e.target.value)}
                        placeholder="30.0"
                        className="h-7 text-[10px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground/50 uppercase">Min Lon</label>
                      <Input
                        type="number"
                        step="0.001"
                        value={gridMinLon}
                        onChange={(e) => setGridMinLon(e.target.value)}
                        placeholder="-98.0"
                        className="h-7 text-[10px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground/50 uppercase">Max Lat</label>
                      <Input
                        type="number"
                        step="0.001"
                        value={gridMaxLat}
                        onChange={(e) => setGridMaxLat(e.target.value)}
                        placeholder="31.0"
                        className="h-7 text-[10px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground/50 uppercase">Max Lon</label>
                      <Input
                        type="number"
                        step="0.001"
                        value={gridMaxLon}
                        onChange={(e) => setGridMaxLon(e.target.value)}
                        placeholder="-97.0"
                        className="h-7 text-[10px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground/50 uppercase">Cell Size (km)</label>
                      <Input
                        type="number"
                        step="0.5"
                        value={gridCellSizeKm}
                        onChange={(e) => setGridCellSizeKm(e.target.value)}
                        placeholder="5"
                        className="h-7 text-[10px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Area */}
      {isSearching ? (
        <div className="space-y-4">
          {/* Loading Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <div>
                <span className="text-sm font-medium text-foreground/80">Searching Google Maps...</span>
                <p className="text-xs text-muted-foreground/50">This may take 10-60 seconds depending on depth and result count</p>
              </div>
            </div>
          </div>

          {/* Loading Skeletons */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-2'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <ResultSkeleton key={i} />
            ))}
          </div>

          {/* Progress Estimation */}
          <div className="flex items-center gap-4 p-3 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03]">
            <Target className="h-4 w-4 text-emerald-400/60 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-emerald-400/80 font-medium">Scraping in progress</span>
                <span className="text-[10px] text-muted-foreground/40">
                  Est. {maxDepth <= 3 ? '10-20s' : maxDepth <= 10 ? '20-45s' : '45-120s'}
                </span>
              </div>
              <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => handleSearch()} />
      ) : results.length > 0 ? (
        <div className="space-y-4" ref={resultsRef}>
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold text-foreground/90">
                  {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                </span>
              </div>
              {meta?.elapsedMs && (
                <Badge variant="outline" className="text-[9px] bg-emerald-500/5 text-emerald-400 border-emerald-500/20">
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  {formatElapsed(meta.elapsedMs)}
                </Badge>
              )}
              {meta?.fastMode && (
                <Badge variant="outline" className="text-[9px] bg-amber-500/5 text-amber-400 border-amber-500/20">
                  <Zap className="h-2.5 w-2.5 mr-1" />
                  Fast Mode
                </Badge>
              )}
            </div>

            {/* View & Sort Controls */}
            <div className="flex items-center gap-2">
              {/* Category Filter */}
              {categories.length > 1 && (
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-7 text-[10px] w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort */}
              <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                <SelectTrigger className="h-7 text-[10px] w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="reviews">Reviews</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
              >
                <ArrowUpDown className={`h-3.5 w-3.5 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
              </Button>

              <Separator orientation="vertical" className="h-5" />

              {/* View Toggle */}
              <div className="flex items-center rounded-md border border-border/30 overflow-hidden">
                <button
                  className={`p-1.5 transition-colors ${
                    viewMode === 'grid' ? 'bg-emerald-500/10 text-emerald-400' : 'text-muted-foreground/50 hover:text-foreground'
                  }`}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  className={`p-1.5 transition-colors ${
                    viewMode === 'list' ? 'bg-emerald-500/10 text-emerald-400' : 'text-muted-foreground/50 hover:text-foreground'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Data Quality Stats Bar */}
          {resultStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-500/[0.03] border border-emerald-500/10">
                <Mail className="h-3.5 w-3.5 text-emerald-400/60" />
                <div>
                  <span className="text-xs font-semibold text-emerald-400">{resultStats.withEmail}</span>
                  <span className="text-[9px] text-muted-foreground/50 ml-1">with email</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-cyan-500/[0.03] border border-cyan-500/10">
                <Phone className="h-3.5 w-3.5 text-cyan-400/60" />
                <div>
                  <span className="text-xs font-semibold text-cyan-400">{resultStats.withPhone}</span>
                  <span className="text-[9px] text-muted-foreground/50 ml-1">with phone</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-violet-500/[0.03] border border-violet-500/10">
                <Globe className="h-3.5 w-3.5 text-violet-400/60" />
                <div>
                  <span className="text-xs font-semibold text-violet-400">{resultStats.withWebsite}</span>
                  <span className="text-[9px] text-muted-foreground/50 ml-1">with website</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/[0.03] border border-amber-500/10">
                <Star className="h-3.5 w-3.5 text-amber-400/60" />
                <div>
                  <span className="text-xs font-semibold text-amber-400">{resultStats.avgRating}</span>
                  <span className="text-[9px] text-muted-foreground/50 ml-1">avg rating</span>
                </div>
              </div>
            </div>
          )}

          {/* Results Grid/List */}
          {filteredResults.length > 0 ? (
            <ScrollArea className="max-h-[calc(100vh-420px)]">
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                  : 'space-y-2'
              }>
                {filteredResults.map((entry) => {
                  const leadKey = `lead-${entry.placeId || entry.inputId}`;
                  const scanKey = `scan-${entry.placeId || entry.inputId}`;
                  return (
                    <BusinessResultCard
                      key={entry.placeId || entry.inputId || entry.title}
                      entry={entry}
                      viewMode={viewMode}
                      onAddToLeads={handleAddToLeads}
                      onDeepScan={handleDeepScan}
                      isAddingLead={!!actionLoading[leadKey]}
                      isScanning={!!actionLoading[scanKey]}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No results match the selected category filter</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-emerald-400"
                onClick={() => setFilterCategory('all')}
              >
                Clear Filter
              </Button>
            </div>
          )}

          {/* Coordinates Preview */}
          {filteredResults.some((r) => r.latitude && r.longitude) && (
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <MapPin className="h-3 w-3" />
                <span>Show coordinates ({filteredResults.filter((r) => r.latitude && r.longitude).length} locations)</span>
                <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-2 rounded-lg border border-border/20 bg-secondary/10 p-3 max-h-48 overflow-y-auto">
                <div className="space-y-1">
                  {filteredResults
                    .filter((r) => r.latitude && r.longitude)
                    .map((entry) => (
                      <div key={entry.placeId || entry.inputId} className="flex items-center gap-3 text-[10px]">
                        <span className="text-emerald-400/60 font-mono">
                          {entry.latitude.toFixed(5)}, {entry.longitude.toFixed(5)}
                        </span>
                        <span className="text-muted-foreground/50 truncate">{entry.title}</span>
                      </div>
                    ))}
                </div>
              </div>
            </details>
          )}

          {/* Export Footer */}
          {filteredResults.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-secondary/10">
              <span className="text-[10px] text-muted-foreground/50">
                {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} exported
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 gap-1 text-muted-foreground hover:text-emerald-400"
                  onClick={handleExportCSV}
                >
                  <Download className="h-3 w-3" />
                  Export CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 gap-1 text-muted-foreground hover:text-cyan-400"
                  onClick={handleExportJSON}
                >
                  <Download className="h-3 w-3" />
                  Export JSON
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

export default GoogleMapsSearch;
