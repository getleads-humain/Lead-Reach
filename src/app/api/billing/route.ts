import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  seedBillingPlans,
  stopSubscription,
  restartSubscription,
  recordConsumption,
  createSubscription,
  getBillingDashboardStats,
} from '@/lib/billing/engine';

// ============================================================
// GET — Dashboard stats, plans, subscriptions
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    // Get dashboard overview
    if (type === 'dashboard') {
      const stats = await getBillingDashboardStats();
      return NextResponse.json(stats);
    }

    // Get all plans
    if (type === 'plans') {
      // Ensure plans are seeded
      await seedBillingPlans();
      const plans = await db.billingPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      const parsed = plans.map((p) => ({
        ...p,
        features: safeParseJSON<string[]>(p.features) || [],
      }));
      return NextResponse.json({ plans: parsed });
    }

    // Get all subscriptions
    if (type === 'subscriptions') {
      const subs = await db.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      });
      return NextResponse.json({ subscriptions: subs });
    }

    // Get single subscription
    if (type === 'subscription') {
      const id = url.searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const sub = await db.subscription.findUnique({
        where: { id },
        include: { plan: true, billingEvents: { orderBy: { createdAt: 'desc' }, take: 20 }, consumptionRecords: { orderBy: { createdAt: 'desc' }, take: 20 } },
      });
      if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ subscription: sub });
    }

    // Get billing events
    if (type === 'events') {
      const subscriptionId = url.searchParams.get('subscriptionId');
      const events = await db.billingEvent.findMany({
        where: subscriptionId ? { subscriptionId } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { subscription: { include: { plan: true } } },
      });
      return NextResponse.json({ events });
    }

    // Default: return dashboard
    const stats = await getBillingDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Billing GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
  }
}

// ============================================================
// POST — Actions: subscribe, stop, restart, consume, seed
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Seed plans
    if (action === 'seed') {
      const result = await seedBillingPlans();
      return NextResponse.json(result);
    }

    // Create subscription
    if (action === 'subscribe') {
      const { planName, clientName, clientEmail, billingCycle } = body;
      if (!planName) return NextResponse.json({ error: 'planName required' }, { status: 400 });
      const result = await createSubscription({ planName, clientName, clientEmail, billingCycle });
      return NextResponse.json(result, { status: 201 });
    }

    // B2B Stop Command
    if (action === 'stop') {
      const { subscriptionId } = body;
      if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });
      const result = await stopSubscription(subscriptionId);
      return NextResponse.json(result);
    }

    // B2B Restart Command
    if (action === 'restart') {
      const { subscriptionId } = body;
      if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });
      const result = await restartSubscription(subscriptionId);
      return NextResponse.json(result);
    }

    // B2C Consumption Event
    if (action === 'consume') {
      const { subscriptionId, resourceType, quantity, description, metadata } = body;
      if (!subscriptionId || !resourceType) {
        return NextResponse.json({ error: 'subscriptionId and resourceType required' }, { status: 400 });
      }
      const result = await recordConsumption(subscriptionId, resourceType, quantity, description, metadata);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('Billing POST error:', error);
    return NextResponse.json({ error: 'Failed to process billing action' }, { status: 500 });
  }
}

// ============================================================
// DELETE — Cancel subscription immediately
// ============================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await db.subscription.update({
      where: { id },
      data: { status: 'expired', cancelAtPeriodEnd: true, cancelledAt: new Date(), apiEnabled: false },
    });

    await db.billingEvent.create({
      data: {
        subscriptionId: id,
        eventType: 'subscription_cancelled',
        amount: 0,
        description: 'Subscription cancelled immediately',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Billing DELETE error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}

function safeParseJSON<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}
