import { NextResponse } from 'next/server';
import { getDownloadRequests } from '@/lib/db';
import { canApproveResults, requireUser } from '@/lib/auth';

// Certificate re-download requests for the director, committee and admins: pending first
export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (!canApproveResults(auth.user)) {
    return NextResponse.json({ success: false, error: 'សម្រាប់ប្រធាន គណៈកម្មការ និង Admin តែប៉ុណ្ណោះ' }, { status: 403 });
  }
  const order = { pending: 0, rejected: 1, approved: 2 };
  const requests = [...getDownloadRequests()].sort((a, b) => order[a.status] - order[b.status] || b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ success: true, requests });
}
