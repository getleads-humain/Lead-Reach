import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const bookings = await db.setterConversation.findMany({
      where: { bookedAppointment: true },
      orderBy: { bookedAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json([], { status: 200 });
  }
}
