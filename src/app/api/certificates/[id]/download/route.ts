import { NextResponse } from 'next/server';
import { consumeCertificateDownload, downloadsLeft, getCertificateById } from '@/lib/db';
import { canApproveResults, requireUser } from '@/lib/auth';

// Called right before printing / saving the PDF. Learners have a limited number of downloads;
// the director, committee and admins can always print.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  const { id } = await params;
  const cert = getCertificateById(id);
  if (!cert) return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });

  if (canApproveResults(auth.user)) {
    return NextResponse.json({ success: true, downloadsLeft: null });
  }
  if (auth.user.email !== cert.studentEmail) {
    return NextResponse.json({ success: false, error: 'មានតែម្ចាស់វិញ្ញាបនបត្រប៉ុណ្ណោះ ដែលអាចទាញយកបាន' }, { status: 403 });
  }
  if (downloadsLeft(cert) <= 0) {
    return NextResponse.json(
      { success: false, error: 'អ្នកបានទាញយកគ្រប់ចំនួនដងហើយ។ សូមស្នើសុំការអនុញ្ញាតដើម្បីទាញយកម្តងទៀត។', requestRequired: true },
      { status: 403 }
    );
  }
  const left = consumeCertificateDownload(cert.id);
  return NextResponse.json({ success: true, downloadsLeft: left });
}
