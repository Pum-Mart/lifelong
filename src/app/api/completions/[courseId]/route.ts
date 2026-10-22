import { NextResponse } from 'next/server';
import { approveCompletion, getCompletion, getCourseBySlug, getUsers, saveCompletion } from '@/lib/db';
import { approverTitle, canApproveResults, requireUser } from '@/lib/auth';
import { deliver } from '@/lib/reports';
import { retryMessage } from '@/lib/assessments';
import { escapeHtml, sendTelegramMessage } from '@/lib/telegram';

// Body: { action: 'approve' | 'reject', note? }. Approving issues certificates automatically.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (!canApproveResults(auth.user)) {
    return NextResponse.json({ success: false, error: 'សម្រាប់ប្រធានមជ្ឈមណ្ឌលតែប៉ុណ្ណោះ' }, { status: 403 });
  }

  const { courseId } = await params;
  const course = getCourseBySlug(courseId);
  const completion = course ? getCompletion(course.id) : null;
  if (!course || !completion) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  if (completion.status !== 'submitted') {
    return NextResponse.json({ success: false, error: 'លទ្ធផលនេះមិនកំពុងរង់ចាំការអនុម័តទេ' }, { status: 409 });
  }

  const { action, note } = await request.json();
  const users = getUsers();
  const teachers = users.filter(u => u.role === 'teacher' && u.instructorId === course.instructorId);
  const origin = new URL(request.url).origin;

  if (action === 'approve') {
    const approved = approveCompletion(course.id, auth.user.name, approverTitle(auth.user))!;
    // Each student: congratulations with their certificate link, or their result if not passed
    for (const r of approved.results) {
      const student = users.find(u => u.id === r.userId);
      if (!student) continue;
      await deliver(
        [student],
        r.passed ? '🎓 សូមអបអរសាទរ! វិញ្ញាបនបត្ររបស់អ្នករួចរាល់' : '📄 លទ្ធផលវគ្គសិក្សា',
        r.passed
          ? `អ្នកបានបញ្ចប់វគ្គ «${course.title}» ដោយទទួលបានពិន្ទុ ${r.total}/100។\nវិញ្ញាបនបត្រ៖ ${origin}/certificate/${r.certificateId}\n\nសូមអរគុណចំពោះការខិតខំសិក្សា!`
          : `វគ្គ «${course.title}»៖ ពិន្ទុរបស់អ្នក ${r.total}/100 (កម្រិតមធ្យម ឬមិនល្អ)។\n\n${retryMessage(r.name)}`
      );
    }
    const passed = approved.results.filter(r => r.passed).length;
    const summary = `វគ្គ «${course.title}» ត្រូវបានអនុម័តដោយ ${auth.user.name}។ បានចេញវិញ្ញាបនបត្រ ${passed} សន្លឹក។`;
    await deliver(teachers, '✅ លទ្ធផលវគ្គត្រូវបានអនុម័ត', summary);
    await sendTelegramMessage(`✅ <b>លទ្ធផលវគ្គត្រូវបានអនុម័ត</b>\n${escapeHtml(summary)}`);
    return NextResponse.json({ success: true, completion: approved });
  }

  if (action === 'reject') {
    const reason = String(note ?? '').trim();
    if (!reason) return NextResponse.json({ success: false, error: 'សូមសរសេរមូលហេតុ' }, { status: 400 });
    const rejected = saveCompletion({
      ...completion,
      status: 'rejected',
      reviewedBy: auth.user.name,
      reviewedAt: new Date().toISOString(),
      reviewNote: reason
    });
    await deliver(teachers, '↩️ លទ្ធផលវគ្គត្រូវបានបង្វិលមកវិញ', `វគ្គ «${course.title}»\nមូលហេតុ៖ ${reason}\n\nសូមកែប្រែ ហើយបញ្ជូនម្តងទៀត។`);
    return NextResponse.json({ success: true, completion: rejected });
  }

  return NextResponse.json({ success: false, error: 'action must be approve or reject' }, { status: 400 });
}
