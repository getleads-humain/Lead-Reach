import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.bookedAppointment !== undefined) updateData.bookedAppointment = body.bookedAppointment;
    if (body.appointmentDate !== undefined) updateData.appointmentDate = body.appointmentDate ? new Date(body.appointmentDate) : null;
    if (body.appointmentNotes !== undefined) updateData.appointmentNotes = body.appointmentNotes;

    const conversation = await db.setterConversation.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
