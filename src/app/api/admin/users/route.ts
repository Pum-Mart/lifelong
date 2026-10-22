import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';
import { requireAdmin, toSessionUser } from '@/lib/auth';

export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ success: true, users: getUsers().map(toSessionUser) });
}
