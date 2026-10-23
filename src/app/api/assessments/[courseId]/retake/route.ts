import { NextResponse } from 'next/server';
import { createRetakeRequest, getCourseBySlug, getEnrollments, getUsers, hasCertificate } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { examAllowance, khmerNumber } from '@/lib/assessments';
import { deliver } from '@/lib/reports';
import { escapeHtml, sendTelegramMessage } from '@/lib/telegram';
import { withDatabase } from '@/lib/store';

// Body: { reason } — letter asking for the next exam round, once this round's attempts are used
async function handlePOST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { user } = auth;

  const { courseId } = await params;
  const course = getCourseBySlug(courseId);
  if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
  if (!getEnrollments(user.id).some(e => e.courseId === course.id)) {
    return NextResponse.json({ success: false, error: 'សូមចុះឈ្មោះចូលរៀនវគ្គនេះជាមុនសិន' }, { status: 403 });
  }
  if (hasCertificate(user.email, course.id)) {
    return NextResponse.json({ success: false, error: 'អ្នកបានទទួលវិញ្ញាបនបត្រវគ្គនេះរួចហើយ' }, { status: 409 });
  }

  const allowance = examAllowance(user.id, course.id);
  if (allowance.pendingRequest) {
    return NextResponse.json({ success: false, error: 'លិខិតស្នើសុំរបស់អ្នកកំពុងរង់ចាំការអនុម័ត' }, { status: 409 });
  }
  if (allowance.left > 0) {
    return NextResponse.json({ success: false, error: `អ្នកនៅសល់ការប្រឡង ${allowance.left} ដងទៀត` }, { status: 409 });
  }

  const { reason } = await request.json();
  const text = String(reason ?? '').trim();
  if (text.length < 5) {
    return NextResponse.json({ success: false, error: 'សូមសរសេរមូលហេតុនៃការស្នើសុំ' }, { status: 400 });
  }

  const round = allowance.round + 1;
  const retake = createRetakeRequest({
    userId: user.id,
    name: user.name,
    email: user.email,
    courseId: course.id,
    courseTitle: course.title,
    round,
    reason: text.slice(0, 1000)
  });

  const title = `📨 លិខិតស្នើសុំប្រឡងលើកទី «${khmerNumber(round)}»`;
  const body = [
    `អ្នកសិក្សា៖ ${user.name} (${user.email})`,
    `វគ្គ៖ ${course.title}`,
    `ស្នើសុំប្រឡងលើកទី «${khmerNumber(round)}»`,
    '',
    `មូលហេតុ៖ ${retake.reason}`,
    '',
    'សូមពិនិត្យ និងអនុញ្ញាត នៅទំព័រអនុម័ត។'
  ].join('\n');
  const approvers = getUsers().filter(u => u.staffTitle === 'director' || u.staffTitle === 'committee' || u.role === 'admin');
  await deliver(approvers, title, body);
  await sendTelegramMessage(`<b>${escapeHtml(title)}</b>\n\n${escapeHtml(body)}`);

  return NextResponse.json({ success: true, request: retake });
}

export const POST = withDatabase(handlePOST);
