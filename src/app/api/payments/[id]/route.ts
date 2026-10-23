import { NextResponse } from 'next/server';
import { reviewPayment } from '@/lib/db';
import { notifyPaymentReviewed } from '@/lib/telegram';
import { requireAdmin } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

// Body: { action: 'approve' | 'reject' }. Approving unlocks the courses for the student.
async function handlePOST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;
    const { action } = await request.json();
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ success: false, error: 'action must be approve or reject' }, { status: 400 });
    }

    const payment = reviewPayment(id, action === 'approve' ? 'approved' : 'rejected');
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found or already reviewed' }, { status: 404 });
    }

    await notifyPaymentReviewed(payment);
    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Error reviewing payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to review payment' }, { status: 500 });
  }
}

export const POST = withDatabase(handlePOST);
