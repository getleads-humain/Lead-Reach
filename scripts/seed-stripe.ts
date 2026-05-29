/**
 * Stripe Product & Price Seed Script
 * ====================================
 * Creates all LeadReach plans as Stripe products with monthly & annual prices.
 * Updates stripe-config.ts with the created price IDs.
 * 
 * Usage: npx tsx scripts/seed-stripe.ts
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

const PRODUCTS = [
  {
    id: 'scout',
    name: 'LeadReach Scout',
    description: 'For solo founders and small teams starting their outbound journey — 3 AI Agents, 1,000 leads/mo, 5 channels',
    monthlyPrice: 14900, // cents
    annualPrice: 149000, // cents ($1,490/yr — 2 months free)
    track: 'b2b',
  },
  {
    id: 'command',
    name: 'LeadReach Command',
    description: 'For growing teams scaling outbound — 8 AI Agents, 10,000+ leads/mo, 17+ channels, multi-step outreach',
    monthlyPrice: 39900,
    annualPrice: 399000, // $3,990/yr
    track: 'b2b',
  },
  {
    id: 'enterprise',
    name: 'LeadReach Enterprise',
    description: 'For enterprises requiring unlimited scale, custom agents, and dedicated support — Contact sales',
    monthlyPrice: 0, // Custom — no self-serve price
    annualPrice: 0,
    track: 'b2b',
  },
  {
    id: 'setter',
    name: 'LeadReach Setter',
    description: 'For solopreneurs automating appointment setting — 2 AI Setters, 500 leads/mo, SMS + Email',
    monthlyPrice: 9700,
    annualPrice: 97000, // $970/yr
    track: 'b2c',
  },
  {
    id: 'closer',
    name: 'LeadReach Closer',
    description: 'For teams scaling conversational booking — Unlimited AI Setters, 10,000+ leads/mo, all channels',
    monthlyPrice: 29700,
    annualPrice: 297000, // $2,970/yr
    track: 'b2c',
  },
  {
    id: 'agency',
    name: 'LeadReach Agency',
    description: 'For agencies managing multiple brands — White-label, unlimited sub-accounts, custom AI training',
    monthlyPrice: 0, // Custom
    annualPrice: 0,
    track: 'b2c',
  },
];

async function main() {
  console.log('🌱 Seeding Stripe products & prices for LeadReach...\n');

  for (const product of PRODUCTS) {
    // Check if product already exists by listing with metadata filter
    const existing = await stripe.products.list({
      limit: 100,
    });
    const found = existing.data.find(p => p.metadata.leadreach_plan_id === product.id);

    if (found) {
      console.log(`⏭️  Product "${product.name}" already exists (id: ${found.id})`);
      continue;
    }

    // Create the product
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: {
        leadreach_plan_id: product.id,
        track: product.track,
      },
      statement_descriptor: product.track === 'b2b' ? 'LEADREACH B2B' : 'LEADREACH B2C',
    });

    console.log(`✅ Created product: ${stripeProduct.name} (${stripeProduct.id})`);

    // Create monthly price (skip for custom plans)
    if (product.monthlyPrice > 0) {
      const monthlyPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: product.monthlyPrice,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: {
          leadreach_plan_id: product.id,
          billing_cycle: 'monthly',
        },
        nickname: `${product.name} — Monthly`,
      });
      console.log(`   💰 Monthly price: $${product.monthlyPrice / 100}/mo (${monthlyPrice.id})`);

      const annualPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: product.annualPrice,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: {
          leadreach_plan_id: product.id,
          billing_cycle: 'annual',
        },
        nickname: `${product.name} — Annual`,
      });
      console.log(`   💰 Annual price: $${product.annualPrice / 100}/yr (${annualPrice.id})`);
    } else {
      console.log(`   🔒 Custom pricing — no self-serve prices created`);
    }

    console.log('');
  }

  console.log('🎉 Stripe seeding complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run: node scripts/sync-price-ids.js');
  console.log('   2. Update STRIPE_WEBHOOK_SECRET in .env');
  console.log('   3. Test checkout with: /api/stripe/checkout?plan=command&cycle=monthly');
}

main().catch(console.error);
