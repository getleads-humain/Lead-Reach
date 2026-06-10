'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Search,
  Star,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Building2,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Download,
  Filter,
  Grid,
  List,
  Navigation,
  Zap,
  RefreshCw,
  CheckCircle2,
  X,
  Map,
  Layers,
  Target,
} from 'lucide-react';
import type { ExtendedGmapsBusiness } from '@/lib/gmaps-bridge';

// ============================================================
// Types
// ============================================================

interface ScrapeJob {
  id: string;
  query: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  resultsCount: number;
  startedAt: Date;
}

interface MapsState {
  searchQuery: string;
  location: string;
  results: ExtendedGmapsBusiness[];
  isLoading: boolean;
  selectedIds: Set<string>;
  viewMode: 'grid' | 'list';
  filters: {
    minRating: number;
    status: string;
    maxResults: number;
    emailExtraction: boolean;
    fastMode: boolean;
    depth: number;
  };
  expandedCards: Set<string>;
  enrichingIds: Set<string>;
  convertingIds: Set<string>;
  stats: {
    totalDiscovered: number;
    convertedToLeads: number;
    avgRating: number;
  };
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// ============================================================
// Helper Functions
// ============================================================

function getUniqueKey(biz: ExtendedGmapsBusiness): string {
  return biz.place_id || biz.data_id || biz.cid || `${biz.title}-${biz.address}`;
}

function renderStars(rating: number, size: 'sm' | 'md' = 'sm') {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const emptyClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < fullStars) {
          return <Star key={i} className={`${sizeClass} fill-amber-400 text-amber-400`} />;
        }
        if (i === fullStars && hasHalf) {
          return (
            <div key={i} className="relative">
              <Star className={`${emptyClass} text-muted-foreground/30`} />
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star className={`${sizeClass} fill-amber-400 text-amber-400`} />
              </div>
            </div>
          );
        }
        return <Star key={i} className={`${emptyClass} text-muted-foreground/30`} />;
      })}
    </div>
  );
}

function formatReviewCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

// ============================================================
// Notification Toast Component
// ============================================================

function NotificationToast({
  notifications,
  onDismiss,
}: {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right ${
            n.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : n.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
          }`}
        >
          {n.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {n.type === 'error' && <X className="h-4 w-4 shrink-0" />}
          {n.type === 'info' && <Zap className="h-4 w-4 shrink-0" />}
          <span className="text-sm flex-1">{n.message}</span>
          <button onClick={() => onDismiss(n.id)} className="shrink-0 hover:opacity-70">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Business Card — Grid View
// ============================================================

function BusinessCardGrid({
  business,
  isSelected,
  isExpanded,
  isEnriching,
  isConverting,
  onToggleSelect,
  onToggleExpand,
  onEnrich,
  onConvertToLead,
}: {
  business: ExtendedGmapsBusiness;
  isSelected: boolean;
  isExpanded: boolean;
  isEnriching: boolean;
  isConverting: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onEnrich: () => void;
  onConvertToLead: () => void;
}) {
  const [showEmails, setShowEmails] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const key = getUniqueKey(business);

  return (
    <Card className="border-border/30 bg-card/50 hover:border-border/50 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="mt-1 h-4 w-4 rounded border-border/50 bg-transparent accent-emerald-500 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-foreground/90 text-sm leading-tight truncate">
                {business.title || 'Unknown Business'}
              </h3>
              <Badge
                className={`shrink-0 text-[10px] ${
                  business.status === 'Open'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : business.status === 'Closed'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-secondary/50 text-muted-foreground border-border/30'
                }`}
                variant="outline"
              >
                {business.status || 'Unknown'}
              </Badge>
            </div>
            {business.category && (
              <Badge variant="outline" className="mt-1 text-[9px] border-cyan-500/20 text-cyan-400">
                {business.category}
              </Badge>
            )}
          </div>
        </div>

        {/* Thumbnail */}
        {business.thumbnail && (
          <div className="rounded-lg overflow-hidden h-32 bg-secondary/20">
            <img
              src={business.thumbnail}
              alt={business.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Rating & Reviews */}
        <div className="flex items-center gap-2">
          {renderStars(business.review_rating, 'sm')}
          <span className="text-xs font-semibold text-foreground/80">{business.review_rating.toFixed(1)}</span>
          <span className="text-[10px] text-muted-foreground">
            ({formatReviewCount(business.review_count)} reviews)
          </span>
          {business.price_range && (
            <Badge variant="outline" className="text-[9px] ml-auto border-amber-500/20 text-amber-400">
              {business.price_range}
            </Badge>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-1.5">
          {business.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
              <span className="text-xs text-muted-foreground line-clamp-2">{business.address}</span>
            </div>
          )}
          {business.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <a
                href={`tel:${business.phone}`}
                className="text-xs text-cyan-400 hover:text-cyan-300 truncate"
              >
                {business.phone}
              </a>
            </div>
          )}
          {business.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <a
                href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 truncate"
              >
                {business.website.replace(/^https?:\/\//, '').split('/')[0]}
                <ExternalLink className="h-2.5 w-2.5 inline ml-0.5" />
              </a>
            </div>
          )}
        </div>

        {/* Emails */}
        {business.emails.length > 0 && (
          <div>
            <button
              onClick={() => setShowEmails(!showEmails)}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300"
            >
              <Mail className="h-3 w-3" />
              <span>{business.emails.length} email{business.emails.length > 1 ? 's' : ''} found</span>
              {showEmails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showEmails && (
              <div className="mt-1.5 space-y-0.5 pl-5">
                {business.emails.map((email, i) => (
                  <a
                    key={i}
                    href={`mailto:${email}`}
                    className="block text-[11px] text-cyan-400 hover:text-cyan-300 truncate"
                  >
                    {email}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Open Hours (Expandable) */}
        {business.open_hours && Object.keys(business.open_hours).length > 0 && (
          <div>
            <button
              onClick={() => setShowHours(!showHours)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground/80"
            >
              <Clock className="h-3 w-3" />
              <span>Opening hours</span>
              {showHours ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showHours && (
              <div className="mt-1.5 space-y-0.5 pl-5">
                {Object.entries(business.open_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">{day}</span>
                    <span className="text-foreground/70">{String(hours)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular Times */}
        {business.popular_times && Object.keys(business.popular_times).length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Navigation className="h-3 w-3" />
            <span>Popular times data available</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/20">
          <Button
            onClick={onConvertToLead}
            disabled={isConverting}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-1.5 transition-all text-xs h-8"
          >
            {isConverting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add to Leads
          </Button>
          <Button
            onClick={onEnrich}
            disabled={isEnriching}
            variant="outline"
            className="flex-1 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 gap-1.5 text-xs h-8"
          >
            {isEnriching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            Enrich
          </Button>
          <Button
            onClick={onToggleExpand}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground gap-1 h-8"
          >
            {isExpanded ? 'Less' : 'More'}
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        {/* Expanded Details */}
        {isExpanded && <BusinessDetails business={business} />}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Business Row — List View
// ============================================================

function BusinessRowList({
  business,
  isSelected,
  isEnriching,
  isConverting,
  onToggleSelect,
  onEnrich,
  onConvertToLead,
}: {
  business: ExtendedGmapsBusiness;
  isSelected: boolean;
  isEnriching: boolean;
  isConverting: boolean;
  onToggleSelect: () => void;
  onEnrich: () => void;
  onConvertToLead: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-secondary/20 transition-colors border border-transparent hover:border-border/20">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="h-4 w-4 rounded border-border/50 bg-transparent accent-emerald-500 shrink-0"
      />
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-1 sm:gap-4 items-center">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground/90 truncate">{business.title || 'Unknown'}</p>
          {business.category && (
            <span className="text-[10px] text-muted-foreground">{business.category}</span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-1">
          {renderStars(business.review_rating, 'sm')}
          <span className="text-[10px] text-muted-foreground ml-1">{business.review_rating.toFixed(1)}</span>
        </div>
        {business.phone && (
          <a href={`tel:${business.phone}`} className="hidden sm:block text-xs text-cyan-400 hover:text-cyan-300 truncate max-w-[140px]">
            {business.phone}
          </a>
        )}
        <div className="hidden sm:block">
          {business.emails.length > 0 ? (
            <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400">
              <Mail className="h-2.5 w-2.5 mr-0.5" />
              {business.emails.length}
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground/40">No email</span>
          )}
        </div>
        <Badge
          className={`hidden sm:inline-flex text-[9px] ${
            business.status === 'Open'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : business.status === 'Closed'
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : 'bg-secondary/50 text-muted-foreground border-border/30'
          }`}
          variant="outline"
        >
          {business.status || '—'}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          onClick={onConvertToLead}
          disabled={isConverting}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-1 text-[10px] h-7 px-2.5"
        >
          {isConverting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Lead
        </Button>
        <Button
          onClick={onEnrich}
          disabled={isEnriching}
          variant="outline"
          className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 gap-1 text-[10px] h-7 px-2.5"
        >
          {isEnriching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Business Details — Expanded View
// ============================================================

function BusinessDetails({ business }: { business: ExtendedGmapsBusiness }) {
  return (
    <div className="space-y-3 pt-3 border-t border-border/20">
      {/* About Section */}
      {business.description && (
        <DetailSection icon={Building2} title="About">
          <p className="text-xs text-muted-foreground leading-relaxed">{business.description}</p>
          {business.about && business.about.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {business.about.map((item) => (
                <div key={item.id || item.name} className="rounded-md bg-secondary/15 p-2">
                  <p className="text-[10px] font-medium text-foreground/70">{item.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.options.map((opt) => (
                      <Badge
                        key={opt.name}
                        variant="outline"
                        className={`text-[8px] ${
                          opt.enabled
                            ? 'border-emerald-500/20 text-emerald-400'
                            : 'border-border/20 text-muted-foreground/40'
                        }`}
                      >
                        {opt.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DetailSection>
      )}

      {/* Contact Section */}
      <DetailSection icon={Mail} title="Contact">
        <div className="space-y-1">
          {business.emails.length > 0 &&
            business.emails.map((email, i) => (
              <div key={i} className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground/60" />
                <a href={`mailto:${email}`} className="text-xs text-cyan-400 hover:text-cyan-300">
                  {email}
                </a>
              </div>
            ))}
          {business.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-muted-foreground/60" />
              <a href={`tel:${business.phone}`} className="text-xs text-cyan-400 hover:text-cyan-300">
                {business.phone}
              </a>
            </div>
          )}
          {business.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3 text-muted-foreground/60" />
              <a
                href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                {business.website}
                <ExternalLink className="h-2.5 w-2.5 inline ml-0.5" />
              </a>
            </div>
          )}
          {business.emails.length === 0 && !business.phone && !business.website && (
            <p className="text-[10px] text-muted-foreground/40 italic">No contact data available</p>
          )}
        </div>
      </DetailSection>

      {/* Location Section */}
      {(business.address || business.complete_address || business.latitude) && (
        <DetailSection icon={MapPin} title="Location">
          <div className="space-y-1">
            {business.address && (
              <p className="text-xs text-muted-foreground">{business.address}</p>
            )}
            {business.complete_address && (
              <div className="grid grid-cols-2 gap-1">
                {business.complete_address.street && (
                  <DataItem label="Street" value={business.complete_address.street} />
                )}
                {business.complete_address.city && (
                  <DataItem label="City" value={business.complete_address.city} />
                )}
                {business.complete_address.state && (
                  <DataItem label="State" value={business.complete_address.state} />
                )}
                {business.complete_address.postal_code && (
                  <DataItem label="Postal Code" value={business.complete_address.postal_code} />
                )}
                {business.complete_address.country && (
                  <DataItem label="Country" value={business.complete_address.country} />
                )}
                {business.complete_address.borough && (
                  <DataItem label="Borough" value={business.complete_address.borough} />
                )}
              </div>
            )}
            {business.latitude && business.longitude && (
              <p className="text-[10px] text-muted-foreground/50">
                Coordinates: {business.latitude.toFixed(4)}, {business.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </DetailSection>
      )}

      {/* Firmographics Section */}
      {(business.price_range || business.review_count > 0 || business.reviews_per_rating) && (
        <DetailSection icon={Users} title="Firmographics">
          <div className="space-y-1.5">
            {business.price_range && (
              <DataItem label="Price Range" value={business.price_range} />
            )}
            <DataItem label="Total Reviews" value={String(business.review_count)} />
            <DataItem label="Avg Rating" value={business.review_rating.toFixed(1)} />
            {business.reviews_per_rating && Object.keys(business.reviews_per_rating).length > 0 && (
              <div className="space-y-0.5">
                <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Rating Distribution</span>
                {Object.entries(business.reviews_per_rating).map(([rating, count]) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-4">{rating}★</span>
                    <div className="flex-1 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400/70 rounded-full"
                        style={{
                          width: `${
                            business.review_count > 0
                              ? ((count as number) / business.review_count) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground/50 w-8 text-right">{count as number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DetailSection>
      )}

      {/* Digital Presence Section */}
      {(business.link || business.street_view_url || business.images.length > 0) && (
        <DetailSection icon={Globe} title="Digital">
          <div className="space-y-1.5">
            {business.link && (
              <a
                href={business.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300"
              >
                <Map className="h-3 w-3" />
                Google Maps Listing
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
            {business.street_view_url && (
              <a
                href={business.street_view_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300"
              >
                <Navigation className="h-3 w-3" />
                Street View
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
            {business.images.length > 0 && (
              <div>
                <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Images</span>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {business.images.slice(0, 6).map((img, i) => (
                    <a
                      key={i}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md overflow-hidden h-16 bg-secondary/20"
                    >
                      <img
                        src={img.url}
                        alt={img.title || `Image ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </a>
                  ))}
                  {business.images.length > 6 && (
                    <div className="rounded-md h-16 bg-secondary/20 flex items-center justify-center text-[10px] text-muted-foreground">
                      +{business.images.length - 6}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DetailSection>
      )}

      {/* Reviews Section */}
      {business.user_reviews.length > 0 && (
        <DetailSection icon={Star} title="Reviews">
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {business.user_reviews.slice(0, 5).map((review, i) => (
                <div key={review.review_id || i} className="rounded-md bg-secondary/15 p-2">
                  <div className="flex items-center gap-2 mb-1">
                    {review.profile_picture ? (
                      <img
                        src={review.profile_picture}
                        alt={review.name}
                        className="h-5 w-5 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-secondary/40 flex items-center justify-center text-[8px] text-muted-foreground font-bold">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-[10px] font-medium text-foreground/80">{review.name}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          className={`h-2 w-2 ${si < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.description && (
                    <p className="text-[10px] text-muted-foreground line-clamp-3">{review.description}</p>
                  )}
                  {(review.when || review.posted_at) && (
                    <span className="text-[8px] text-muted-foreground/40 mt-1 block">
                      {review.when || review.posted_at}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DetailSection>
      )}

      {/* Hours Section */}
      {business.open_hours && Object.keys(business.open_hours).length > 0 && (
        <DetailSection icon={Clock} title="Hours">
          <div className="space-y-0.5">
            {Object.entries(business.open_hours).map(([day, hours]) => (
              <div key={day} className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">{day}</span>
                <span className="text-foreground/70">{String(hours)}</span>
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Actions Section — Reservations, Order Online, Menu */}
      {(business.reservations.length > 0 || business.order_online.length > 0 || business.menu) && (
        <DetailSection icon={ExternalLink} title="Actions">
          <div className="space-y-1.5">
            {business.reservations.length > 0 &&
              business.reservations.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <ExternalLink className="h-3 w-3" />
                  Reservations: {r.title}
                </a>
              ))}
            {business.order_online.length > 0 &&
              business.order_online.map((o, i) => (
                <a
                  key={i}
                  href={o.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <Globe className="h-3 w-3" />
                  Order Online: {o.title}
                </a>
              ))}
            {business.menu && (
              <a
                href={business.menu.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300"
              >
                <Layers className="h-3 w-3" />
                Menu: {business.menu.title}
              </a>
            )}
          </div>
        </DetailSection>
      )}

      {/* Owner */}
      {business.owner && (
        <DetailSection icon={Users} title="Owner">
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground/80">{business.owner.name}</span>
            {business.owner.link && (
              <a
                href={business.owner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-cyan-400 hover:text-cyan-300"
              >
                Profile <ExternalLink className="h-2 w-2 inline" />
              </a>
            )}
          </div>
        </DetailSection>
      )}

      {/* Timezone */}
      {business.timezone && (
        <div className="text-[10px] text-muted-foreground/50 pt-1">
          Timezone: {business.timezone}
        </div>
      )}
    </div>
  );
}

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-border/20 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-secondary/15 hover:bg-secondary/25 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-[10px] font-medium text-foreground/70">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground/40" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
        )}
      </button>
      {open && <div className="px-3 py-2">{children}</div>}
    </div>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">{label}</span>
      <p className="text-[11px] text-foreground/80">{value}</p>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState({ hasSearched }: { hasSearched: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-2xl p-4 bg-secondary/10 mb-4">
        <Map className="h-10 w-10 text-muted-foreground/30" />
      </div>
      {hasSearched ? (
        <>
          <h3 className="text-lg font-semibold text-foreground/80 mb-2">No businesses found</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Try adjusting your search query, location, or filters to discover more businesses.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-foreground/80 mb-2">Discover Local Businesses</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Search for businesses on Google Maps by entering a query and location. Discover, enrich, and convert them into leads.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {['Dentists in Berlin', 'Coffee shops in New York', 'Plumbers in London', 'Gyms in Tokyo'].map(
              (suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="cursor-pointer border-border/30 text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-400 transition-colors text-[10px]"
                >
                  <Search className="h-2.5 w-2.5 mr-1" />
                  {suggestion}
                </Badge>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function MapsDiscoveryView() {
  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<ExtendedGmapsBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [minRating, setMinRating] = useState(0);
  const [statusFilter, setStatusFilter] = useState('any');
  const [maxResults, setMaxResults] = useState(25);
  const [emailExtraction, setEmailExtraction] = useState(false);
  const [fastMode, setFastMode] = useState(false);
  const [depth, setDepth] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGridScraping, setShowGridScraping] = useState(false);
  const [gridMinLat, setGridMinLat] = useState('');
  const [gridMinLon, setGridMinLon] = useState('');
  const [gridMaxLat, setGridMaxLat] = useState('');
  const [gridMaxLon, setGridMaxLon] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalDiscovered: 0,
    convertedToLeads: 0,
    avgRating: 0,
  });
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name' | 'distance'>('rating');
  const [hasSearched, setHasSearched] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scrapeJobs, setScrapeJobs] = useState<ScrapeJob[]>([]);
  const [serviceHealth, setServiceHealth] = useState<'ok' | 'down' | 'checking' | 'unknown'>('unknown');

  // ----------------------------------------------------------
  // Notification helpers
  // ----------------------------------------------------------
  const addNotification = useCallback((type: Notification['type'], message: string) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setNotifications((prev) => [...prev.slice(-4), { id, type, message }]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [notifications]);

  // ----------------------------------------------------------
  // Check health on mount
  // ----------------------------------------------------------
  useEffect(() => {
    const checkHealth = async () => {
      setServiceHealth('checking');
      try {
        const res = await fetch('/api/gmaps/health');
        if (res.ok) {
          const data = await res.json();
          setServiceHealth(data.status === 'ok' ? 'ok' : 'down');
        } else {
          setServiceHealth('down');
        }
      } catch {
        setServiceHealth('down');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  // ----------------------------------------------------------
  // Search
  // ----------------------------------------------------------
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      addNotification('error', 'Please enter a search query');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const body: Record<string, unknown> = {
        query: searchQuery,
        location: location || undefined,
        options: {
          maxResults,
          email: emailExtraction,
          fastMode,
          depth,
        },
      };

      const res = await fetch('/api/gmaps/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Search failed' }));
        throw new Error(err.error || 'Search failed');
      }

      const data = await res.json();
      let mappedResults: ExtendedGmapsBusiness[] = [];

      if (Array.isArray(data.results)) {
        mappedResults = data.results.map((raw: Record<string, unknown>) => {
          // Import mapToExtendedBusiness inline since we can't use the function from bridge (it's server-side)
          const raw_any = raw as Record<string, unknown>;
          return {
            input_id: (raw_any.input_id as string) || '',
            link: (raw_any.link as string) || (raw_any.url as string) || '',
            title: (raw_any.title as string) || (raw_any.name as string) || '',
            category: (raw_any.category as string) || (raw_any.type as string) || '',
            categories: Array.isArray(raw_any.categories) ? (raw_any.categories as string[]) : [],
            address: (raw_any.address as string) || (raw_any.full_address as string) || '',
            open_hours: (raw_any.open_hours as Record<string, unknown>) || (raw_any.operating_hours as Record<string, unknown>) || {},
            popular_times: (raw_any.popular_times as Record<string, unknown>) || {},
            website: (raw_any.website as string) || (raw_any.site as string) || '',
            phone: (raw_any.phone as string) || '',
            plus_code: (raw_any.plus_code as string) || '',
            review_count: typeof raw_any.review_count === 'number' ? raw_any.review_count : (typeof raw_any.reviews === 'number' ? raw_any.reviews : 0),
            review_rating: typeof raw_any.review_rating === 'number' ? raw_any.review_rating : (typeof raw_any.rating === 'number' ? raw_any.rating : 0),
            reviews_per_rating: (raw_any.reviews_per_rating as Record<string, number>) || {},
            latitude: typeof raw_any.latitude === 'number' ? raw_any.latitude : (typeof raw_any.lat === 'number' ? raw_any.lat : 0),
            longitude: typeof raw_any.longitude === 'number' ? raw_any.longitude : (typeof raw_any.lng === 'number' ? raw_any.lng : 0),
            cid: (raw_any.cid as string) || '',
            status: (raw_any.status as string) || (typeof raw_any.open_now === 'boolean' ? (raw_any.open_now ? 'Open' : 'Closed') : ''),
            description: (raw_any.description as string) || '',
            reviews_link: (raw_any.reviews_link as string) || '',
            thumbnail: (raw_any.thumbnail as string) || (raw_any.image_url as string) || (raw_any.photo as string) || '',
            timezone: (raw_any.timezone as string) || '',
            price_range: (raw_any.price_range as string) || '',
            data_id: (raw_any.data_id as string) || '',
            street_view_url: (raw_any.street_view_url as string) || '',
            place_id: (raw_any.place_id as string) || (raw_any.id as string) || '',
            images: Array.isArray(raw_any.images) ? (raw_any.images as Array<{ url: string; title: string }>) : [],
            reservations: Array.isArray(raw_any.reservations) ? (raw_any.reservations as Array<{ url: string; title: string }>) : [],
            order_online: Array.isArray(raw_any.order_online) ? (raw_any.order_online as Array<{ url: string; title: string }>) : [],
            menu: (raw_any.menu as { url: string; title: string } | null) || null,
            owner: (raw_any.owner as { id: string; name: string; link: string } | null) || null,
            complete_address: (raw_any.complete_address as ExtendedGmapsBusiness['complete_address']) || null,
            about: Array.isArray(raw_any.about) ? (raw_any.about as ExtendedGmapsBusiness['about']) : [],
            user_reviews: Array.isArray(raw_any.user_reviews) ? (raw_any.user_reviews as ExtendedGmapsBusiness['user_reviews']) : [],
            emails: Array.isArray(raw_any.emails) ? (raw_any.emails as string[]) : [],
          } as ExtendedGmapsBusiness;
        });
      }

      // Apply filters
      let filtered = mappedResults;
      if (minRating > 0) {
        filtered = filtered.filter((b) => b.review_rating >= minRating);
      }
      if (statusFilter === 'open') {
        filtered = filtered.filter((b) => b.status === 'Open');
      } else if (statusFilter === 'closed') {
        filtered = filtered.filter((b) => b.status === 'Closed');
      }

      setResults(filtered);
      setStats((prev) => ({
        totalDiscovered: prev.totalDiscovered + filtered.length,
        convertedToLeads: prev.convertedToLeads,
        avgRating:
          filtered.length > 0
            ? filtered.reduce((sum, b) => sum + b.review_rating, 0) / filtered.length
            : prev.avgRating,
      }));
      addNotification('success', `Found ${filtered.length} businesses`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      addNotification('error', `Search failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, location, maxResults, emailExtraction, fastMode, depth, minRating, statusFilter, addNotification]);

  // ----------------------------------------------------------
  // Discover
  // ----------------------------------------------------------
  const handleDiscover = useCallback(async () => {
    if (!searchQuery.trim() || !location.trim()) {
      addNotification('error', 'Both search query and location are required for discovery');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/gmaps/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: searchQuery,
          location,
          minRating: minRating > 0 ? minRating : undefined,
          openNow: statusFilter === 'open' ? true : undefined,
          maxResults,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Discovery failed' }));
        throw new Error(err.error || 'Discovery failed');
      }

      const data = await res.json();
      const businesses: ExtendedGmapsBusiness[] = (data.businesses || []).map(
        (raw: Record<string, unknown>) => {
          const r = raw as Record<string, unknown>;
          return {
            input_id: (r.input_id as string) || '',
            link: (r.link as string) || (r.url as string) || '',
            title: (r.title as string) || (r.name as string) || '',
            category: (r.category as string) || '',
            categories: Array.isArray(r.categories) ? (r.categories as string[]) : [],
            address: (r.address as string) || '',
            open_hours: (r.open_hours as Record<string, unknown>) || {},
            popular_times: (r.popular_times as Record<string, unknown>) || {},
            website: (r.website as string) || '',
            phone: (r.phone as string) || '',
            plus_code: (r.plus_code as string) || '',
            review_count: typeof r.review_count === 'number' ? r.review_count : 0,
            review_rating: typeof r.review_rating === 'number' ? r.review_rating : 0,
            reviews_per_rating: (r.reviews_per_rating as Record<string, number>) || {},
            latitude: typeof r.latitude === 'number' ? r.latitude : 0,
            longitude: typeof r.longitude === 'number' ? r.longitude : 0,
            cid: (r.cid as string) || '',
            status: (r.status as string) || '',
            description: (r.description as string) || '',
            reviews_link: (r.reviews_link as string) || '',
            thumbnail: (r.thumbnail as string) || '',
            timezone: (r.timezone as string) || '',
            price_range: (r.price_range as string) || '',
            data_id: (r.data_id as string) || '',
            street_view_url: (r.street_view_url as string) || '',
            place_id: (r.place_id as string) || '',
            images: Array.isArray(r.images) ? (r.images as Array<{ url: string; title: string }>) : [],
            reservations: Array.isArray(r.reservations) ? (r.reservations as Array<{ url: string; title: string }>) : [],
            order_online: Array.isArray(r.order_online) ? (r.order_online as Array<{ url: string; title: string }>) : [],
            menu: null,
            owner: null,
            complete_address: (r.complete_address as ExtendedGmapsBusiness['complete_address']) || null,
            about: Array.isArray(r.about) ? (r.about as ExtendedGmapsBusiness['about']) : [],
            user_reviews: Array.isArray(r.user_reviews) ? (r.user_reviews as ExtendedGmapsBusiness['user_reviews']) : [],
            emails: Array.isArray(r.emails) ? (r.emails as string[]) : [],
          } as ExtendedGmapsBusiness;
        }
      );

      setResults(businesses);
      setStats((prev) => ({
        totalDiscovered: prev.totalDiscovered + businesses.length,
        convertedToLeads: prev.convertedToLeads,
        avgRating:
          businesses.length > 0
            ? businesses.reduce((sum, b) => sum + b.review_rating, 0) / businesses.length
            : prev.avgRating,
      }));
      addNotification('success', `Discovered ${businesses.length} businesses`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      addNotification('error', `Discovery failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, location, minRating, statusFilter, maxResults, addNotification]);

  // ----------------------------------------------------------
  // Enrich
  // ----------------------------------------------------------
  const handleEnrich = useCallback(
    async (business: ExtendedGmapsBusiness) => {
      const key = getUniqueKey(business);
      setEnrichingIds((prev) => new Set(prev).add(key));

      try {
        const res = await fetch('/api/gmaps/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: business.title,
            location: business.address,
            website: business.website,
            enrichOptions: { email: true },
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Enrichment failed' }));
          throw new Error(err.error || 'Enrichment failed');
        }

        const data = await res.json();
        const enriched = data.enriched_data as Record<string, unknown> | undefined;

        if (enriched) {
          // Merge enriched data back into results
          setResults((prev) =>
            prev.map((b) => {
              if (getUniqueKey(b) === key) {
                const emails = Array.isArray(enriched.emails) ? (enriched.emails as string[]) : b.emails;
                return {
                  ...b,
                  emails: emails.length > 0 ? emails : b.emails,
                  description: (enriched.description as string) || b.description,
                  phone: (enriched.phone as string) || b.phone,
                  website: (enriched.website as string) || b.website,
                };
              }
              return b;
            })
          );
        }

        addNotification('success', `Enriched ${business.title}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        addNotification('error', `Enrichment failed: ${msg}`);
      } finally {
        setEnrichingIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [addNotification]
  );

  // ----------------------------------------------------------
  // Convert to Lead
  // ----------------------------------------------------------
  const handleConvertToLead = useCallback(
    async (business: ExtendedGmapsBusiness) => {
      const key = getUniqueKey(business);
      setConvertingIds((prev) => new Set(prev).add(key));

      try {
        const res = await fetch('/api/gmaps/convert-to-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Conversion failed' }));
          throw new Error(err.error || 'Conversion failed');
        }

        setStats((prev) => ({
          ...prev,
          convertedToLeads: prev.convertedToLeads + 1,
        }));
        addNotification('success', `Added ${business.title} to leads`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        addNotification('error', `Failed to add lead: ${msg}`);
      } finally {
        setConvertingIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [addNotification]
  );

  // ----------------------------------------------------------
  // Bulk Actions
  // ----------------------------------------------------------
  const handleBulkAddToLeads = useCallback(async () => {
    const selectedBusinesses = results.filter((b) => selectedIds.has(getUniqueKey(b)));
    if (selectedBusinesses.length === 0) return;

    let successCount = 0;
    for (const business of selectedBusinesses) {
      try {
        const res = await fetch('/api/gmaps/convert-to-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business }),
        });
        if (res.ok) successCount++;
      } catch {
        // Skip failures
      }
    }

    setStats((prev) => ({
      ...prev,
      convertedToLeads: prev.convertedToLeads + successCount,
    }));
    addNotification('success', `Added ${successCount} of ${selectedBusinesses.length} businesses to leads`);
    setSelectedIds(new Set());
  }, [results, selectedIds, addNotification]);

  const handleBulkEnrich = useCallback(async () => {
    const selectedBusinesses = results.filter((b) => selectedIds.has(getUniqueKey(b)));
    if (selectedBusinesses.length === 0) return;

    const keys = selectedBusinesses.map(getUniqueKey);
    setEnrichingIds((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.add(k));
      return next;
    });

    let successCount = 0;
    for (const business of selectedBusinesses) {
      try {
        const res = await fetch('/api/gmaps/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: business.title,
            location: business.address,
            website: business.website,
            enrichOptions: { email: true },
          }),
        });
        if (res.ok) successCount++;
      } catch {
        // Skip failures
      }
    }

    setEnrichingIds((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.delete(k));
      return next;
    });
    addNotification('info', `Enriched ${successCount} of ${selectedBusinesses.length} businesses`);
  }, [results, selectedIds, addNotification]);

  const handleExportCSV = useCallback(() => {
    const businessesToExport =
      selectedIds.size > 0 ? results.filter((b) => selectedIds.has(getUniqueKey(b))) : results;

    if (businessesToExport.length === 0) {
      addNotification('error', 'No businesses to export');
      return;
    }

    const headers = [
      'Title',
      'Category',
      'Address',
      'Phone',
      'Website',
      'Rating',
      'Review Count',
      'Status',
      'Price Range',
      'Emails',
      'Latitude',
      'Longitude',
      'Description',
    ];

    const rows = businessesToExport.map((b) => [
      b.title,
      b.category,
      b.address,
      b.phone,
      b.website,
      String(b.review_rating),
      String(b.review_count),
      b.status,
      b.price_range,
      b.emails.join('; '),
      String(b.latitude),
      String(b.longitude),
      `"${(b.description || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gmaps-discovery-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addNotification('success', `Exported ${businessesToExport.length} businesses to CSV`);
  }, [results, selectedIds, addNotification]);

  // ----------------------------------------------------------
  // Grid Search
  // ----------------------------------------------------------
  const handleGridSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      addNotification('error', 'Please enter a search query for grid search');
      return;
    }
    const minLatVal = parseFloat(gridMinLat);
    const minLonVal = parseFloat(gridMinLon);
    const maxLatVal = parseFloat(gridMaxLat);
    const maxLonVal = parseFloat(gridMaxLon);

    if ([minLatVal, minLonVal, maxLatVal, maxLonVal].some(isNaN)) {
      addNotification('error', 'Please enter valid bounding box coordinates');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    const jobId = `job-${Date.now()}`;
    setScrapeJobs((prev) => [
      ...prev,
      {
        id: jobId,
        query: `${searchQuery} (grid)`,
        status: 'running',
        progress: 0,
        resultsCount: 0,
        startedAt: new Date(),
      },
    ]);

    try {
      const res = await fetch('/api/gmaps/grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          boundingBox: {
            minLat: minLatVal,
            minLon: minLonVal,
            maxLat: maxLatVal,
            maxLon: maxLonVal,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Grid search failed' }));
        throw new Error(err.error || 'Grid search failed');
      }

      const data = await res.json();
      const businesses: ExtendedGmapsBusiness[] = (data.results || []).map(
        (raw: Record<string, unknown>) => {
          const r = raw as Record<string, unknown>;
          return {
            input_id: (r.input_id as string) || '',
            link: (r.link as string) || '',
            title: (r.title as string) || (r.name as string) || '',
            category: (r.category as string) || '',
            categories: Array.isArray(r.categories) ? (r.categories as string[]) : [],
            address: (r.address as string) || '',
            open_hours: (r.open_hours as Record<string, unknown>) || {},
            popular_times: (r.popular_times as Record<string, unknown>) || {},
            website: (r.website as string) || '',
            phone: (r.phone as string) || '',
            plus_code: '',
            review_count: typeof r.review_count === 'number' ? r.review_count : 0,
            review_rating: typeof r.review_rating === 'number' ? r.review_rating : 0,
            reviews_per_rating: {},
            latitude: typeof r.latitude === 'number' ? r.latitude : 0,
            longitude: typeof r.longitude === 'number' ? r.longitude : 0,
            cid: '',
            status: (r.status as string) || '',
            description: (r.description as string) || '',
            reviews_link: '',
            thumbnail: '',
            timezone: '',
            price_range: '',
            data_id: '',
            street_view_url: '',
            place_id: (r.place_id as string) || '',
            images: [],
            reservations: [],
            order_online: [],
            menu: null,
            owner: null,
            complete_address: null,
            about: [],
            user_reviews: [],
            emails: Array.isArray(r.emails) ? (r.emails as string[]) : [],
          } as ExtendedGmapsBusiness;
        }
      );

      setResults(businesses);
      setStats((prev) => ({
        totalDiscovered: prev.totalDiscovered + businesses.length,
        convertedToLeads: prev.convertedToLeads,
        avgRating:
          businesses.length > 0
            ? businesses.reduce((sum, b) => sum + b.review_rating, 0) / businesses.length
            : prev.avgRating,
      }));

      setScrapeJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, status: 'completed' as const, progress: 100, resultsCount: businesses.length }
            : j
        )
      );

      addNotification('success', `Grid search found ${businesses.length} businesses`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      addNotification('error', `Grid search failed: ${msg}`);
      setScrapeJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'failed' as const } : j))
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, gridMinLat, gridMinLon, gridMaxLat, gridMaxLon, addNotification]);

  // ----------------------------------------------------------
  // Selection handlers
  // ----------------------------------------------------------
  const toggleSelect = useCallback((key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(getUniqueKey)));
    }
  }, [selectedIds, results]);

  const toggleExpand = useCallback((key: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // ----------------------------------------------------------
  // Sort results
  // ----------------------------------------------------------
  const sortedResults = React.useMemo(() => {
    const sorted = [...results];
    switch (sortBy) {
      case 'rating':
        sorted.sort((a, b) => b.review_rating - a.review_rating);
        break;
      case 'reviews':
        sorted.sort((a, b) => b.review_count - a.review_count);
        break;
      case 'name':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'distance':
        // Sort by distance (use latitude as proxy if no user location)
        sorted.sort((a, b) => Math.abs(a.latitude) - Math.abs(b.latitude));
        break;
    }
    return sorted;
  }, [results, sortBy]);

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NotificationToast notifications={notifications} onDismiss={dismissNotification} />

      {/* ============================================================ */}
      {/* Header Section */}
      {/* ============================================================ */}
      <div className="border-b border-border/20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2.5 bg-emerald-500/10 text-emerald-400">
                  <Map className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">Maps Discovery</h1>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                      Powered by Google Maps
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Discover and enrich local businesses using Google Maps data
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{stats.totalDiscovered}</div>
                <div className="text-[10px] text-muted-foreground">Discovered</div>
              </div>
              <div className="h-8 w-px bg-border/30" />
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">{stats.convertedToLeads}</div>
                <div className="text-[10px] text-muted-foreground">Leads</div>
              </div>
              <div className="h-8 w-px bg-border/30" />
              <div className="text-center">
                <div className="text-lg font-bold text-amber-400">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
                </div>
                <div className="text-[10px] text-muted-foreground">Avg Rating</div>
              </div>
              <div className="h-8 w-px bg-border/30" />
              <div className="text-center">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    serviceHealth === 'ok'
                      ? 'border-emerald-500/20 text-emerald-400'
                      : serviceHealth === 'down'
                      ? 'border-red-500/20 text-red-400'
                      : 'border-border/30 text-muted-foreground'
                  }`}
                >
                  <div
                    className={`h-1.5 w-1.5 rounded-full mr-1 ${
                      serviceHealth === 'ok'
                        ? 'bg-emerald-400'
                        : serviceHealth === 'down'
                        ? 'bg-red-400'
                        : serviceHealth === 'checking'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                  {serviceHealth === 'ok' ? 'Service Up' : serviceHealth === 'down' ? 'Service Down' : serviceHealth === 'checking' ? 'Checking...' : 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Search Bar Section */}
      {/* ============================================================ */}
      <div className="border-b border-border/20 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Main Search Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                placeholder="Search businesses (e.g., 'dentists in Berlin')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-background/50 border-border/30"
                disabled={isLoading}
              />
            </div>
            <div className="relative sm:w-56">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                placeholder="Location (e.g., 'New York')"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-background/50 border-border/30"
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
              <Button
                onClick={handleDiscover}
                disabled={isLoading}
                variant="outline"
                className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                Discover
              </Button>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Filter className="h-3.5 w-3.5 text-muted-foreground/50" />
            <Select value={String(minRating)} onValueChange={(v) => setMinRating(Number(v))}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-background/50 border-border/30">
                <SelectValue placeholder="Min Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any Rating</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="3.5">3.5+ Stars</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[100px] h-8 text-xs bg-background/50 border-border/30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={String(maxResults)} onValueChange={(v) => setMaxResults(Number(v))}>
              <SelectTrigger className="w-[100px] h-8 text-xs bg-background/50 border-border/30">
                <SelectValue placeholder="Max Results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 results</SelectItem>
                <SelectItem value="25">25 results</SelectItem>
                <SelectItem value="50">50 results</SelectItem>
                <SelectItem value="100">100 results</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={emailExtraction ? 'default' : 'outline'}
              size="sm"
              className={`h-8 text-xs gap-1.5 ${
                emailExtraction
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'border-border/30 text-muted-foreground'
              }`}
              onClick={() => setEmailExtraction(!emailExtraction)}
            >
              <Mail className="h-3 w-3" />
              Email Extraction
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Advanced
            </Button>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="mt-3 rounded-lg border border-border/20 bg-secondary/10 p-3 space-y-3 animate-in slide-in-from-top">
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  variant={fastMode ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 text-xs gap-1.5 ${
                    fastMode
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                      : 'border-border/30 text-muted-foreground'
                  }`}
                  onClick={() => setFastMode(!fastMode)}
                >
                  <Zap className="h-3 w-3" />
                  Fast Mode
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Depth:</span>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={depth}
                    onChange={(e) => setDepth(Math.max(1, Math.min(20, Number(e.target.value))))}
                    className="w-16 h-8 text-xs bg-background/50 border-border/30"
                  />
                </div>

                <Button
                  variant={showGridScraping ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 text-xs gap-1.5 ${
                    showGridScraping
                      ? 'bg-violet-500/20 text-violet-400 border-violet-500/30 hover:bg-violet-500/30'
                      : 'border-border/30 text-muted-foreground'
                  }`}
                  onClick={() => setShowGridScraping(!showGridScraping)}
                >
                  <Layers className="h-3 w-3" />
                  Grid Scraping
                </Button>
              </div>

              {/* Grid Scraping Bounding Box */}
              {showGridScraping && (
                <div className="space-y-2 pt-2 border-t border-border/20">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layers className="h-3 w-3" />
                    <span className="font-medium">Bounding Box Coordinates</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Input
                      placeholder="Min Lat (e.g., 40.70)"
                      value={gridMinLat}
                      onChange={(e) => setGridMinLat(e.target.value)}
                      className="h-8 text-xs bg-background/50 border-border/30"
                    />
                    <Input
                      placeholder="Min Lon (e.g., -74.02)"
                      value={gridMinLon}
                      onChange={(e) => setGridMinLon(e.target.value)}
                      className="h-8 text-xs bg-background/50 border-border/30"
                    />
                    <Input
                      placeholder="Max Lat (e.g., 40.80)"
                      value={gridMaxLat}
                      onChange={(e) => setGridMaxLat(e.target.value)}
                      className="h-8 text-xs bg-background/50 border-border/30"
                    />
                    <Input
                      placeholder="Max Lon (e.g., -73.92)"
                      value={gridMaxLon}
                      onChange={(e) => setGridMaxLon(e.target.value)}
                      className="h-8 text-xs bg-background/50 border-border/30"
                    />
                  </div>
                  <Button
                    onClick={handleGridSearch}
                    disabled={isLoading}
                    variant="outline"
                    className="border-violet-500/20 text-violet-400 hover:bg-violet-500/10 gap-2 text-xs h-8"
                  >
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
                    Run Grid Search
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Bulk Actions Bar */}
      {/* ============================================================ */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-30 border-b border-border/20 bg-emerald-500/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === results.length && results.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-border/50 accent-emerald-500"
              />
              {selectedIds.size} selected
            </label>
            <Button
              onClick={handleBulkAddToLeads}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-1.5 text-xs h-8"
            >
              <Plus className="h-3 w-3" />
              Add {selectedIds.size} to Leads
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="border-border/30 text-muted-foreground hover:text-foreground gap-1.5 text-xs h-8"
            >
              <Download className="h-3 w-3" />
              Export CSV
            </Button>
            <Button
              onClick={handleBulkEnrich}
              variant="outline"
              size="sm"
              className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 gap-1.5 text-xs h-8"
            >
              <Zap className="h-3 w-3" />
              Enrich All (Emails)
            </Button>
            <Button
              onClick={() => setSelectedIds(new Set())}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 ml-auto"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Results Section */}
      {/* ============================================================ */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Results Header */}
          {results.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{results.length}</span> businesses found
                </span>
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs bg-background/50 border-border/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">By Rating</SelectItem>
                    <SelectItem value="reviews">By Reviews</SelectItem>
                    <SelectItem value="name">By Name</SelectItem>
                    <SelectItem value="distance">By Distance</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center border border-border/30 rounded-md overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-8 w-8 p-0 rounded-none ${
                      viewMode === 'grid'
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-8 w-8 p-0 rounded-none ${
                      viewMode === 'list'
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <Button
                  onClick={handleSearch}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          )}

          {/* Results Grid / List */}
          {results.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedResults.map((business) => {
                  const key = getUniqueKey(business);
                  return (
                    <BusinessCardGrid
                      key={key}
                      business={business}
                      isSelected={selectedIds.has(key)}
                      isExpanded={expandedCards.has(key)}
                      isEnriching={enrichingIds.has(key)}
                      isConverting={convertingIds.has(key)}
                      onToggleSelect={() => toggleSelect(key)}
                      onToggleExpand={() => toggleExpand(key)}
                      onEnrich={() => handleEnrich(business)}
                      onConvertToLead={() => handleConvertToLead(business)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {sortedResults.map((business) => {
                  const key = getUniqueKey(business);
                  return (
                    <BusinessRowList
                      key={key}
                      business={business}
                      isSelected={selectedIds.has(key)}
                      isEnriching={enrichingIds.has(key)}
                      isConverting={convertingIds.has(key)}
                      onToggleSelect={() => toggleSelect(key)}
                      onEnrich={() => handleEnrich(business)}
                      onConvertToLead={() => handleConvertToLead(business)}
                    />
                  );
                })}
              </div>
            )
          ) : (
            <EmptyState hasSearched={hasSearched} />
          )}

          {/* Loading Skeleton */}
          {isLoading && results.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-border/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 w-3/4 bg-secondary/20 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-secondary/15 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-secondary/10 rounded animate-pulse" />
                    <div className="h-32 bg-secondary/10 rounded animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-8 flex-1 bg-secondary/10 rounded animate-pulse" />
                      <div className="h-8 flex-1 bg-secondary/10 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Job Status Section */}
      {/* ============================================================ */}
      {scrapeJobs.length > 0 && (
        <div className="border-t border-border/20 bg-card/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Scrape Jobs
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] text-muted-foreground hover:text-foreground h-6"
                onClick={() => setScrapeJobs([])}
              >
                Clear
              </Button>
            </div>
            <div className="space-y-2">
              {scrapeJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 rounded-lg border border-border/20 p-3 bg-secondary/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground/80 truncate">
                        {job.query}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${
                          job.status === 'running'
                            ? 'border-cyan-500/20 text-cyan-400'
                            : job.status === 'completed'
                            ? 'border-emerald-500/20 text-emerald-400'
                            : 'border-red-500/20 text-red-400'
                        }`}
                      >
                        {job.status === 'running' && <Loader2 className="h-2.5 w-2.5 animate-spin mr-0.5" />}
                        {job.status === 'completed' && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                        {job.status}
                      </Badge>
                    </div>
                    {job.status === 'running' && (
                      <Progress value={job.progress} className="h-1.5 bg-secondary/30 [&>div]:bg-cyan-400" />
                    )}
                    {job.status === 'completed' && (
                      <span className="text-[10px] text-muted-foreground">
                        {job.resultsCount} results found
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground/50 shrink-0">
                    {job.startedAt.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Footer */}
      {/* ============================================================ */}
      <footer className="mt-auto border-t border-border/20 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/50">
            LeadReach Maps Discovery — Powered by Google Maps Scraper
          </span>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[9px] ${
                serviceHealth === 'ok'
                  ? 'border-emerald-500/20 text-emerald-400'
                  : 'border-red-500/20 text-red-400'
              }`}
            >
              Scraper Service: {serviceHealth === 'ok' ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
