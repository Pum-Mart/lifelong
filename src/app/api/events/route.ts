import { NextResponse } from 'next/server';
import { readDatabase, rsvpWorkshopEvent } from '@/lib/db';
import { getSessionUser, requireUser } from '@/lib/auth';
import { notifyEventRsvp } from '@/lib/telegram';
import { WorkshopEvent } from '@/types';
import { withDatabase } from '@/lib/store';

// Attendee ids stay on the server
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const publicEvent = ({ attendeeIds, ...event }: WorkshopEvent) => event;

async function handleGET() {
  try {
    const db = readDatabase();
    const user = await getSessionUser();
    const rsvpdEventIds = user ? db.events.filter(e => e.attendeeIds?.includes(user.id)).map(e => e.id) : [];
    return NextResponse.json({ success: true, events: db.events.map(publicEvent), rsvpdEventIds });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 });
  }
}

async function handlePOST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const { eventId } = body;
    if (!eventId) {
      return NextResponse.json({ success: false, error: 'eventId is required' }, { status: 400 });
    }

    const result = rsvpWorkshopEvent(eventId, auth.user.id);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }
    if (result.status === 'full') {
      return NextResponse.json({ success: false, error: 'សិក្ខាសាលានេះពេញហើយ' }, { status: 409 });
    }
    if (result.status === 'booked') await notifyEventRsvp(result.event);

    return NextResponse.json({ success: true, event: publicEvent(result.event), alreadyBooked: result.status === 'already' });
  } catch (error) {
    console.error('Error in event RSVP:', error);
    return NextResponse.json({ success: false, error: 'Failed to RSVP' }, { status: 500 });
  }
}

export const GET = withDatabase(handleGET);
export const POST = withDatabase(handlePOST);
