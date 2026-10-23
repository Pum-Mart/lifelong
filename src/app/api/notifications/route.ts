import { NextResponse } from 'next/server';
import { getNotifications, markNotificationsRead } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

async function handleGET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const notifications = getNotifications(auth.user.id);
  return NextResponse.json({ success: true, notifications, unread: notifications.filter(n => !n.readAt).length });
}

// Marks every notification as read
async function handlePOST() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  markNotificationsRead(auth.user.id);
  return NextResponse.json({ success: true });
}

export const GET = withDatabase(handleGET);
export const POST = withDatabase(handlePOST);
