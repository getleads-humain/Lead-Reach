import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Gather analytics from all relevant tables
    const [setters, conversations, abTests, followUps] = await Promise.all([
      db.aISetter.findMany(),
      db.setterConversation.findMany(),
      db.aBTest.findMany(),
      db.followUpSequence.findMany(),
    ]);

    const totalConversations = setters.reduce((a, s) => a + s.conversationsHandled, 0);
    const totalQualified = setters.reduce((a, s) => a + s.leadsQualified, 0);
    const totalBooked = setters.reduce((a, s) => a + s.leadsBooked, 0);
    const avgConversion = setters.length > 0 ? setters.reduce((a, s) => a + s.conversionRate, 0) / setters.length : 0;
    const avgResponseTime = setters.length > 0 ? setters.reduce((a, s) => a + s.avgResponseTime, 0) / setters.length : 0;

    // Channel performance
    const channelPerf = ['sms', 'whatsapp', 'instagram', 'messenger', 'email'].map(ch => {
      const chConvs = conversations.filter(c => c.leadChannel === ch);
      return {
        channel: ch,
        total: chConvs.length,
        qualified: chConvs.filter(c => c.status === 'qualified' || c.status === 'booked').length,
        booked: chConvs.filter(c => c.bookedAppointment).length,
        avgScore: chConvs.length > 0 ? Math.round(chConvs.reduce((a, c) => a + c.qualificationScore, 0) / chConvs.length) : 0,
      };
    });

    return NextResponse.json({
      summary: {
        totalConversations,
        totalQualified,
        totalBooked,
        avgConversion: Math.round(avgConversion * 10) / 10,
        avgResponseTime: Math.round(avgResponseTime),
        qualificationRate: totalConversations > 0 ? Math.round((totalQualified / totalConversations) * 100) : 0,
        bookingRate: totalConversations > 0 ? Math.round((totalBooked / totalConversations) * 100) : 0,
      },
      setters: setters.map(s => ({
        name: s.name,
        conversationsHandled: s.conversationsHandled,
        leadsQualified: s.leadsQualified,
        leadsBooked: s.leadsBooked,
        conversionRate: s.conversionRate,
        avgResponseTime: s.avgResponseTime,
      })),
      abTests,
      followUps,
      channelPerformance: channelPerf,
      conversations: conversations.slice(0, 20).map(c => ({
        id: c.id,
        leadName: c.leadName,
        channel: c.leadChannel,
        status: c.status,
        qualificationScore: c.qualificationScore,
        booked: c.bookedAppointment,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({
      summary: { totalConversations: 0, totalQualified: 0, totalBooked: 0, avgConversion: 0, avgResponseTime: 0, qualificationRate: 0, bookingRate: 0 },
      setters: [], abTests: [], followUps: [], channelPerformance: [], conversations: [],
    }, { status: 200 });
  }
}
