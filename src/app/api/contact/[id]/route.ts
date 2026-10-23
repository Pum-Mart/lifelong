import { NextResponse } from 'next/server';
import { setMessageHandled } from '@/lib/content';
import { requireAdmin } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

// Body: { handled: boolean }
async function handlePATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const { handled } = await request.json();
  return NextResponse.json({ success: setMessageHandled(id, Boolean(handled)) });
}

export const PATCH = withDatabase(handlePATCH);
