import { NextResponse } from 'next/server';
import { getUsers, reviewRetakeRequest } from '@/lib/db';
import { canApproveResults, requireUser } from '@/lib/auth';
import { EXAM_ATTEMPTS_PER_ROUND, khmerNumber } from '@/lib/assessments';
import { deliver } from '@/lib/reports';

// Body: { action: 'approve' | 'reject', note? }. Approving opens the next exam round.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (!canApproveResults(auth.user)) {
    return NextResponse.json({ success: false, error: 'សម្រាប់ប្រធាន គណៈកម្មការ និង Admin តែប៉ុណ្ណោះ' }, { status: 403 });
  }

  const { id } = await params;
  const { action, note } = await request.json();
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ success: false, error: 'action must be approve or reject' }, { status: 400 });
  }
  const reason = String(note ?? '').trim();
  if (action === 'reject' && !reason) {
    return NextResponse.json({ success: false, error: 'សូមសរសេរមូលហេតុ' }, { status: 400 });
  }

  const reviewed = reviewRetakeRequest(id, action, auth.user.name, reason || undefined);
  if (!reviewed) {
    return NextResponse.json({ success: false, error: 'លិខិតនេះមិនកំពុងរង់ចាំការអនុម័តទេ' }, { status: 409 });
  }

  const learner = getUsers().find(u => u.id === reviewed.userId);
  if (learner) {
    await deliver(
      [learner],
      action === 'approve' ? `✅ អនុញ្ញាតឱ្យប្រឡងលើកទី «${khmerNumber(reviewed.round)}»` : `❌ លិខិតស្នើសុំប្រឡងលើកទី «${khmerNumber(reviewed.round)}» មិនត្រូវបានអនុញ្ញាត`,
      action === 'approve'
        ? `វគ្គ «${reviewed.courseTitle}»\nអ្នកអាចប្រឡងបាន ${EXAM_ATTEMPTS_PER_ROUND} ដងទៀត (អនុញ្ញាតដោយ ${auth.user.name})។ សូមរៀបចំខ្លួនឱ្យបានល្អ!`
        : `វគ្គ «${reviewed.courseTitle}»\nមូលហេតុ៖ ${reason}`
    );
  }
  return NextResponse.json({ success: true, request: reviewed });
}
