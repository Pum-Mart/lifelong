import { NextResponse } from 'next/server';
import { getNotifications, markNotificationsRead } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const notifications = getNotifications(auth.user.id);
  return NextResponse.json({ success: true, notifications, unread: notifications.filter(n => !n.readAt).length });
}

// Marks every notification as read
export async function POST() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  markNotificationsRead(auth.user.id);
  return NextResponse.json({ success: true });
}
