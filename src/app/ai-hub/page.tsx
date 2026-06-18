import { AIActivationHub } from '@/components/ai-activate/ai-activation-hub';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Activation Hub — LeadReach AI',
  description: 'Every AI capability on LeadReach in one place. 24+ AI features across 14 domains: leads, email, messaging, setters, campaigns, reports, analytics, outreach, ABM, bookings, pipeline, ICP, settings, billing.',
};

export const dynamic = 'force-dynamic';

export default function AIHubPage() {
  return <AIActivationHub />;
}
