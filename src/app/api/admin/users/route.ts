import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';
import { requireAdmin, toSessionUser } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

async function handleGET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ success: true, users: getUsers().map(toSessionUser) });
}

export const GET = withDatabase(handleGET);
