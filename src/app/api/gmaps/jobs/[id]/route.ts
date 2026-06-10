import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scraperParams = new URLSearchParams();
    scraperParams.set('XTransformPort', '5340');

    const response = await fetch(`/api/v1/jobs/${id}?${scraperParams.toString()}`);

    if (!response.ok) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GMaps Job Detail API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scraperParams = new URLSearchParams();
    scraperParams.set('XTransformPort', '5340');

    const response = await fetch(`/api/v1/jobs/${id}?${scraperParams.toString()}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[GMaps Job Delete API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
