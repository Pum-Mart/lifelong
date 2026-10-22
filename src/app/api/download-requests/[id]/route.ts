import { NextResponse } from 'next/server';
import { DOWNLOADS_PER_GRANT, getUsers, reviewDownloadRequest } from '@/lib/db';
import { canApproveResults, requireUser } from '@/lib/auth';
import { deliver } from '@/lib/reports';

// Body: { action: 'approve' | 'reject', note? }. Approving grants more downloads.
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
  if (action === 'reject' && !reason) return NextResponse.json({ success: false, error: 'សូមសរសេរមូលហេតុ' }, { status: 400 });

  const reviewed = reviewDownloadRequest(id, action, auth.user.name, reason || undefined);
  if (!reviewed) return NextResponse.json({ success: false, error: 'សំណើនេះមិនកំពុងរង់ចាំការអនុម័តទេ' }, { status: 409 });

  const learner = getUsers().find(u => u.id === reviewed.userId);
  if (learner) {
    const origin = new URL(request.url).origin;
    await deliver(
      [learner],
      action === 'approve' ? '✅ អនុញ្ញាតឱ្យទាញយកវិញ្ញាបនបត្រ' : '❌ សំណើទាញយកវិញ្ញាបនបត្រមិនត្រូវបានអនុញ្ញាត',
      action === 'approve'
        ? `វិញ្ញាបនបត្រលេខ ${reviewed.certificateCode}\nអ្នកអាចទាញយកបាន ${DOWNLOADS_PER_GRANT} ដងទៀត (អនុញ្ញាតដោយ ${auth.user.name})។\n${origin}/certificate/${reviewed.certificateId}`
        : `វិញ្ញាបនបត្រលេខ ${reviewed.certificateCode}\nមូលហេតុ៖ ${reason}`
    );
  }
  return NextResponse.json({ success: true, request: reviewed });
}
