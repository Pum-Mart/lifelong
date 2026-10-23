import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { withDatabase } from '@/lib/store';
import {
  clearLoginFailures,
  loginLockedFor,
  recordLoginFailure,
  startSession,
  toSessionUser,
  verifyPassword
} from '@/lib/auth';

// Body: { email, password }
async function handlePOST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    const locked = loginLockedFor(email);
    if (locked > 0) {
      const minutes = Math.ceil(locked / 60_000);
      return NextResponse.json(
        { success: false, error: `ព្យាយាមខុសច្រើនដងពេក។ សូមរង់ចាំ ${minutes} នាទី ហើយព្យាយាមម្តងទៀត។` },
        { status: 429 }
      );
    }

    const user = getUserByEmail(email);
    // Same message for unknown email and wrong password, so accounts can't be probed
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      recordLoginFailure(email);
      return NextResponse.json({ success: false, error: 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ' }, { status: 401 });
    }

    clearLoginFailures(email);
    await startSession(user);
    return NextResponse.json({ success: true, user: toSessionUser(user) });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ success: false, error: 'Failed to log in' }, { status: 500 });
  }
}

export const POST = withDatabase(handlePOST);
