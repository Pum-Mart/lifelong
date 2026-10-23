import { NextResponse } from 'next/server';
import { getCompletions } from '@/lib/db';
import { canApproveResults, requireUser } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

// Result sheets for the director: waiting ones first, then recent decisions
async function handleGET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (!canApproveResults(auth.user)) {
    return NextResponse.json({ success: false, error: 'សម្រាប់ប្រធានមជ្ឈមណ្ឌលតែប៉ុណ្ណោះ' }, { status: 403 });
  }
  const order = { submitted: 0, rejected: 1, approved: 2, draft: 3 };
  const completions = getCompletions()
    .filter(c => c.status !== 'draft')
    .sort((a, b) => order[a.status] - order[b.status] || b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ success: true, completions });
}

export const GET = withDatabase(handleGET);
