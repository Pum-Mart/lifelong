import { NextResponse } from 'next/server';
import { downloadsLeft, getCertificateById, getDownloadRequestsFor, DOWNLOADS_PER_GRANT } from '@/lib/db';
import { canApproveResults, getSessionUser } from '@/lib/auth';

// Public for verification. The owner (and approvers) also get their download allowance.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const certificate = getCertificateById(id);
    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    const user = await getSessionUser();
    const isOwner = Boolean(user && user.email === certificate.studentEmail);
    const isApprover = Boolean(user && canApproveResults(user));
    const requests = isOwner ? getDownloadRequestsFor(certificate.id) : [];
    const last = requests[requests.length - 1];

    // Hide the counters from the public view
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { downloadCount, downloadAllowance, ...publicCert } = certificate;
    return NextResponse.json({
      success: true,
      certificate: publicCert,
      access: {
        isOwner,
        isApprover,
        canDownload: isApprover || (isOwner && downloadsLeft(certificate) > 0),
        downloadsLeft: isOwner ? downloadsLeft(certificate) : null,
        perGrant: DOWNLOADS_PER_GRANT,
        pendingRequest: requests.some(r => r.status === 'pending'),
        lastRejected: last?.status === 'rejected' ? { reviewNote: last.reviewNote, reviewedBy: last.reviewedBy } : null,
        neverGranted: isOwner && (certificate.downloadAllowance ?? DOWNLOADS_PER_GRANT) === 0
      }
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch certificate' }, { status: 500 });
  }
}
