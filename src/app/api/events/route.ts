import { NextResponse } from 'next/server';
import { readDatabase, rsvpWorkshopEvent } from '@/lib/db';
import { notifyEventRsvp } from '@/lib/telegram';

export async function GET() {
  try {
    const db = readDatabase();
    return NextResponse.json({ success: true, events: db.events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId } = body;
    if (!eventId) {
      return NextResponse.json({ success: false, error: 'eventId is required' }, { status: 400 });
    }

    const current = readDatabase().events.find(e => e.id === eventId);
    if (current && current.seatsBooked >= current.seatsTotal) {
      return NextResponse.json({ success: false, error: 'សិក្ខាសាលានេះពេញហើយ' }, { status: 409 });
    }

    const updatedEvent = rsvpWorkshopEvent(eventId);
    if (!updatedEvent) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    await notifyEventRsvp(updatedEvent);

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Error in event RSVP:', error);
    return NextResponse.json({ success: false, error: 'Failed to RSVP' }, { status: 500 });
  }
}
