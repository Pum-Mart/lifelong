import { NextResponse } from 'next/server';
import { getCourses, getEnrollments, getPayments, createPayment } from '@/lib/db';
import { BANK_ACCOUNTS, PAY_CURRENCIES, normalizeKhPhone, quotePayment } from '@/lib/payment';
import { notifyPaymentSubmitted } from '@/lib/telegram';
import { requireUser } from '@/lib/auth';

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

// ?scope=all lists everyone's payments (admins only); otherwise the user's own
export async function GET(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  try {
    const all = new URL(request.url).searchParams.get('scope') === 'all';
    if (all && auth.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'សម្រាប់អ្នកគ្រប់គ្រងតែប៉ុណ្ណោះ' }, { status: 403 });
    }
    return NextResponse.json({ success: true, payments: getPayments(all ? undefined : auth.user.id) });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// Multipart form: courseIds (JSON array), couponCode, bankId, payCurrency (USD | KHR),
// payerName, payerPhone (Cambodian number), transactionRef, receipt (optional image file).
// Cash payments at the centre need neither a reference nor a receipt. The student is the signed-in user.
export async function POST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { user } = auth;

  try {
    const form = await request.formData();
    const field = (name: string) => String(form.get(name) ?? '').trim();

    const userId = user.id;
    const bank = BANK_ACCOUNTS.find(b => b.id === field('bankId'));
    const isCash = bank?.kind === 'cash';
    const payCurrency = PAY_CURRENCIES.find(c => c === field('payCurrency')) || 'USD';
    const payerName = field('payerName');
    const payerPhone = normalizeKhPhone(field('payerPhone'));
    const transactionRef = field('transactionRef');
    const receipt = form.get('receipt');
    const receiptFile = receipt instanceof File && receipt.size > 0 ? receipt : undefined;

    let courseIds: string[] = [];
    try {
      courseIds = JSON.parse(field('courseIds') || '[]');
    } catch {
      courseIds = [];
    }

    if (!userId || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ success: false, error: 'សូមជ្រើសរើសវគ្គសិក្សា' }, { status: 400 });
    }
    if (!bank) {
      return NextResponse.json({ success: false, error: 'សូមជ្រើសរើសធនាគារ' }, { status: 400 });
    }
    if (!payerName) {
      return NextResponse.json({ success: false, error: 'សូមបញ្ចូលឈ្មោះអ្នកបង់ប្រាក់' }, { status: 400 });
    }
    if (!payerPhone) {
      return NextResponse.json({ success: false, error: 'លេខទូរស័ព្ទមិនត្រឹមត្រូវ (ឧ. 012 345 678 ឬ +855 12 345 678)' }, { status: 400 });
    }
    if (!isCash && !transactionRef && !receiptFile) {
      return NextResponse.json({ success: false, error: 'សូមបញ្ចូលលេខប្រតិបត្តិការ ឬភ្ជាប់រូបបង្កាន់ដៃ' }, { status: 400 });
    }
    if (receiptFile && (!receiptFile.type.startsWith('image/') || receiptFile.size > MAX_RECEIPT_BYTES)) {
      return NextResponse.json({ success: false, error: 'បង្កាន់ដៃត្រូវជារូបភាព ហើយមិនលើស 5MB' }, { status: 400 });
    }

    // Prices always come from the database, never from the browser. Skip courses the
    // student already owns or has already paid for and is waiting on.
    const enrolledIds = new Set(getEnrollments(userId).map(e => e.courseId));
    const pendingIds = new Set(
      getPayments(userId)
        .filter(p => p.status === 'pending')
        .flatMap(p => p.items.map(i => i.courseId))
    );
    const courses = getCourses().filter(
      c => courseIds.includes(c.id) && c.price > 0 && !enrolledIds.has(c.id) && !pendingIds.has(c.id)
    );
    if (courses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'វគ្គទាំងនេះបានចុះឈ្មោះរួច ឬកំពុងរង់ចាំការផ្ទៀងផ្ទាត់' },
        { status: 409 }
      );
    }

    const quote = quotePayment(courses.map(c => c.price), field('couponCode'), user.isMember);
    const payment = createPayment({
      userId,
      studentName: user.name,
      studentEmail: user.email,
      items: courses.map(c => ({ courseId: c.id, courseTitle: c.title, price: c.price })),
      subtotal: quote.subtotal,
      memberDiscountAmount: quote.memberDiscountAmount,
      couponCode: quote.couponCode,
      discountAmount: quote.discountAmount,
      total: quote.total,
      totalKhr: quote.totalKhr,
      payCurrency,
      bankId: bank.id,
      bankName: bank.name,
      payerName,
      payerPhone,
      transactionRef: transactionRef || undefined,
      hasReceipt: Boolean(receiptFile)
    });

    await notifyPaymentSubmitted(
      payment,
      receiptFile ? { file: receiptFile, filename: receiptFile.name || 'receipt.jpg' } : undefined
    );

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit payment' }, { status: 500 });
  }
}
