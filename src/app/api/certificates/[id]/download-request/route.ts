import { NextResponse } from 'next/server';
import { createDownloadRequest, downloadsLeft, getCertificateById, getDownloadRequestsFor, getUsers } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { deliver } from '@/lib/reports';
import { escapeHtml, sendTelegramMessage } from '@/lib/telegram';

// Body: { reason } — asks the director/committee/admin for more downloads of one's certificate
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { user } = auth;

  const { id } = await params;
  const cert = getCertificateById(id);
  if (!cert) return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
  if (user.email !== cert.studentEmail) {
    return NextResponse.json({ success: false, error: 'មានតែម្ចាស់វិញ្ញាបនបត្រប៉ុណ្ណោះ' }, { status: 403 });
  }
  if (downloadsLeft(cert) > 0) {
    return NextResponse.json({ success: false, error: `អ្នកនៅសល់ការទាញយក ${downloadsLeft(cert)} ដងទៀត` }, { status: 409 });
  }
  if (getDownloadRequestsFor(cert.id).some(r => r.status === 'pending')) {
    return NextResponse.json({ success: false, error: 'សំណើរបស់អ្នកកំពុងរង់ចាំការអនុម័ត' }, { status: 409 });
  }

  const { reason } = await request.json();
  const text = String(reason ?? '').trim();
  if (text.length < 5) return NextResponse.json({ success: false, error: 'សូមសរសេរមូលហេតុនៃការស្នើសុំ' }, { status: 400 });

  const created = createDownloadRequest({
    certificateId: cert.id,
    certificateCode: cert.certificateCode,
    userId: user.id,
    name: user.name,
    email: user.email,
    courseTitle: cert.courseTitle,
    reason: text.slice(0, 1000)
  });

  const body = [
    `អ្នកសិក្សា៖ ${user.name} (${user.email})`,
    `វិញ្ញាបនបត្រលេខ៖ ${cert.certificateCode}`,
    `វគ្គ៖ ${cert.courseTitle}`,
    '',
    `មូលហេតុ៖ ${created.reason}`
  ].join('\n');
  const approvers = getUsers().filter(u => u.staffTitle === 'director' || u.staffTitle === 'committee' || u.role === 'admin');
  // First request of a free-study certificate is the handover itself
  const title = (cert.downloadAllowance ?? 2) === 0 ? '📥 ស្នើសុំទទួលវិញ្ញាបនបត្រ (ផ្នែកឥតបង់ថ្លៃ)' : '📥 ស្នើសុំទាញយកវិញ្ញាបនបត្រម្តងទៀត';
  await deliver(approvers, title, body);
  await sendTelegramMessage(`<b>${escapeHtml(title)}</b>\n\n${escapeHtml(body)}`);
  return NextResponse.json({ success: true, request: created });
}
