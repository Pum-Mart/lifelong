import { NextResponse } from 'next/server';
import { getAdminAnalytics } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const stats = getAdminAnalytics();
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
