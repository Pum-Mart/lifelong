import { NextResponse } from 'next/server';
import { updateUser } from '@/lib/db';
import { getSessionAccount, hashPassword, startSession, validatePassword, verifyPassword } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

// Body: { currentPassword, newPassword }. Signs out every other session.
async function handlePOST(request: Request) {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ success: false, error: 'សូមចូលគណនីជាមុនសិន', loginRequired: true }, { status: 401 });
  }

  try {
    const body = await request.json();
    const currentPassword = String(body.currentPassword ?? '');
    const newPassword = String(body.newPassword ?? '');

    if (!(await verifyPassword(currentPassword, account.passwordHash))) {
      return NextResponse.json({ success: false, error: 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ' }, { status: 400 });
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) return NextResponse.json({ success: false, error: passwordError }, { status: 400 });

    const updated = updateUser(account.id, {
      passwordHash: await hashPassword(newPassword),
      sessionVersion: account.sessionVersion + 1
    });
    // Re-issue this browser's session with the new version so it stays signed in
    if (updated) await startSession(updated);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ success: false, error: 'Failed to change password' }, { status: 500 });
  }
}

export const POST = withDatabase(handlePOST);
