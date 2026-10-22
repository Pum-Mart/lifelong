import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { runScheduledReports, sendCourseEndNotices, sendWeeklyReports } from '@/lib/reports';

// Body: { type: 'weekly' } sends the weekly letters now (admins).
// The scheduler (scripts/telegram-bot.mjs) calls { type: 'scheduled' } with the shared secret
// header; it only sends when a report is due.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const fromScheduler = Boolean(secret) && request.headers.get('x-scheduler-secret') === secret;

  if (!fromScheduler) {
    const auth = await requireAdmin();
    if ('response' in auth) return auth.response;
  }

  try {
    if (fromScheduler && body.type === 'scheduled') {
      return NextResponse.json({ success: true, ...(await runScheduledReports()) });
    }
    if (body.type === 'weekly') {
      const weekly = await sendWeeklyReports();
      const endNotices = await sendCourseEndNotices();
      return NextResponse.json({ success: true, weekly, endNotices });
    }
    return NextResponse.json({ success: false, error: 'type must be weekly' }, { status: 400 });
  } catch (error) {
    console.error('Error sending reports:', error);
    return NextResponse.json({ success: false, error: 'Failed to send reports' }, { status: 500 });
  }
}
