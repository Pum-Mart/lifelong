import { NextResponse } from 'next/server';
import { updateUser } from '@/lib/db';
import { getSessionUser, requireUser, toSessionUser } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

async function handleGET() {
  return NextResponse.json({ success: true, user: await getSessionUser() });
}

// Body: { name?, isMember? } — lets a user rename themselves and join/leave membership
async function handlePATCH(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const changes: Parameters<typeof updateUser>[1] = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ success: false, error: 'សូមបញ្ចូលឈ្មោះ' }, { status: 400 });
      changes.name = name;
    }
    if (typeof body.isMember === 'boolean' && body.isMember !== auth.user.isMember) {
      changes.isMember = body.isMember;
      changes.memberSince = body.isMember ? new Date().toISOString() : undefined;
    }

    const updated = updateUser(auth.user.id, changes);
    return NextResponse.json({ success: true, user: updated ? toSessionUser(updated) : null });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ success: false, error: 'Failed to update account' }, { status: 500 });
  }
}

export const GET = withDatabase(handleGET);
export const PATCH = withDatabase(handlePATCH);
