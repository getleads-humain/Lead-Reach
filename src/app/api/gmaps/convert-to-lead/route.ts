import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business, campaignId } = body;

    if (!business) {
      return NextResponse.json({ error: 'business data is required' }, { status: 400 });
    }

    // Map GmapsBusiness fields to Lead model fields
    const leadData: any = {
      name: business.title || 'Unknown',
      company: business.title || '',
      email: business.emails?.[0] || '',
      phone: business.phone || '',
      website: business.website || '',
      address: business.address || '',
      city: business.complete_address?.city || '',
      state: business.complete_address?.state || '',
      country: business.complete_address?.country || '',
      postalCode: business.complete_address?.postal_code || '',
      industry: business.category || '',
      description: business.description || '',
      source: 'google-maps',
      score: Math.round((business.review_rating || 0) * 20), // 5-star → 100 scale
      status: 'new',
      tags: [
        ...(business.categories || []),
        `gmaps-rating:${business.review_rating || 0}`,
        `gmaps-reviews:${business.review_count || 0}`,
        business.status === 'Open' ? 'open' : business.status || '',
        business.price_range ? `price:${business.price_range}` : '',
      ].filter(Boolean),
      notes: JSON.stringify({
        gmaps_link: business.link || '',
        place_id: business.place_id || '',
        latitude: business.latitude || 0,
        longitude: business.longitude || 0,
        timezone: business.timezone || '',
        open_hours: business.open_hours || {},
        popular_times: business.popular_times || {},
        images: business.images || [],
        about: business.about || [],
        review_count: business.review_count || 0,
        review_rating: business.review_rating || 0,
        price_range: business.price_range || '',
        cid: business.cid || '',
        data_id: business.data_id || '',
        plus_code: business.plus_code || '',
        street_view_url: business.street_view_url || '',
        reservations: business.reservations || [],
        order_online: business.order_online || [],
        menu: business.menu || null,
        owner: business.owner || null,
        all_emails: business.emails || [],
        user_reviews_sample: (business.user_reviews || []).slice(0, 5),
      }),
    };

    // Create the lead
    const lead = await db.lead.create({
      data: leadData,
    });

    // Optionally add to campaign
    if (campaignId) {
      try {
        await db.campaign.update({
          where: { id: campaignId },
          data: { leads: { connect: { id: lead.id } } },
        });
      } catch (e) {
        // Campaign not found or connection failed, lead is still created
        console.warn('Failed to add lead to campaign:', e);
      }
    }

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      campaign_id: campaignId || undefined,
    });
  } catch (error: any) {
    console.error('[GMaps Convert-to-Lead API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
