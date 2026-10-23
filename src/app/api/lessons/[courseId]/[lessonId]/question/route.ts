import { NextResponse } from 'next/server';
import { getCourseBySlug, getUsers } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { deliver } from '@/lib/reports';
import { withDatabase } from '@/lib/store';

// Body: { question } — a learner's question about a lesson, sent to the course's teachers and
// the admins (inbox + Telegram for those who linked it)
async function handlePOST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { user } = auth;

  const { courseId, lessonId } = await params;
  const course = getCourseBySlug(courseId);
  const lesson = course?.modules.flatMap(m => m.lessons).find(l => l.id === lessonId);
  if (!course || !lesson) return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });

  const { question } = await request.json().catch(() => ({}));
  const text = String(question ?? '').trim().slice(0, 1500);
  if (text.length < 3) return NextResponse.json({ success: false, error: 'សូមសរសេរសំណួរ' }, { status: 400 });

  const users = getUsers();
  const recipients = users.filter(u => (u.role === 'teacher' && u.instructorId === course.instructorId) || u.role === 'admin');
  await deliver(
    recipients,
    `❓ សំណួរពីអ្នកសិក្សា — ${course.title}`,
    [`អ្នកសិក្សា៖ ${user.name} (${user.email})`, `មេរៀន៖ ${lesson.title}`, '', text].join('\n')
  );
  return NextResponse.json({ success: true, sentTo: recipients.length });
}

export const POST = withDatabase(handlePOST);
