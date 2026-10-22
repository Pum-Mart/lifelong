import { NextResponse } from 'next/server';
import { getUsers, reviewCertificateRequest } from '@/lib/db';
import { approverTitle, canApproveResults, requireUser } from '@/lib/auth';
import { deliver } from '@/lib/reports';

// Body: { action: 'approve' | 'reject', note? }. Approving issues the certificate automatically.
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

  const result = reviewCertificateRequest(id, action, auth.user.name, reason || undefined, approverTitle(auth.user));
  if (!result) {
    return NextResponse.json({ success: false, error: 'សំណើនេះមិនកំពុងរង់ចាំការអនុម័តទេ' }, { status: 409 });
  }

  const learner = getUsers().find(u => u.id === result.request.userId);
  if (learner) {
    const origin = new URL(request.url).origin;
    await deliver(
      [learner],
      action === 'approve' ? '🎓 សូមអបអរសាទរ! វិញ្ញាបនបត្ររបស់អ្នករួចរាល់' : '📄 សំណើវិញ្ញាបនបត្រ',
      action === 'approve'
        ? `អ្នកបានបញ្ចប់វគ្គ «${result.request.courseTitle}» ដោយជោគជ័យ។\nវិញ្ញាបនបត្រ៖ ${origin}/certificate/${result.certificate!.id}\n\nសូមអរគុណចំពោះការខិតខំសិក្សា!`
        : `វគ្គ «${result.request.courseTitle}»\nមូលហេតុ៖ ${reason}\n\nសូមពិនិត្យឡើងវិញ ហើយធ្វើប្រឡងម្តងទៀត។`
    );
  }
  return NextResponse.json({ success: true, ...result });
}
