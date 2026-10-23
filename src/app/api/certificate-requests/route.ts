import { NextResponse } from 'next/server';
import { getCertificateRequests } from '@/lib/db';
import { canApproveResults, requireUser } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

// Self-study certificate requests for the director, committee and admins: pending first
async function handleGET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (!canApproveResults(auth.user)) {
    return NextResponse.json({ success: false, error: 'សម្រាប់ប្រធាន គណៈកម្មការ និង Admin តែប៉ុណ្ណោះ' }, { status: 403 });
  }
  const order = { pending: 0, rejected: 1, approved: 2 };
  const requests = [...getCertificateRequests()].sort(
    (a, b) => order[a.status] - order[b.status] || b.createdAt.localeCompare(a.createdAt)
  );
  return NextResponse.json({ success: true, requests });
}

export const GET = withDatabase(handleGET);
