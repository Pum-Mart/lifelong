import { NextResponse } from 'next/server';
import { endSession } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

async function handlePOST() {
  await endSession();
  return NextResponse.json({ success: true });
}

export const POST = withDatabase(handlePOST);
