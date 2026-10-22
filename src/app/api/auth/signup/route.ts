import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import { hashPassword, isOwnerEmail, startSession, toSessionUser, validatePassword } from '@/lib/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Body: { name, email, password, joinMembership }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!name) return NextResponse.json({ success: false, error: 'សូមបញ្ចូលឈ្មោះ' }, { status: 400 });
    if (!EMAIL_PATTERN.test(email)) return NextResponse.json({ success: false, error: 'អ៊ីមែលមិនត្រឹមត្រូវ' }, { status: 400 });
    const passwordError = validatePassword(password);
    if (passwordError) return NextResponse.json({ success: false, error: passwordError }, { status: 400 });
    if (getUserByEmail(email)) {
      return NextResponse.json({ success: false, error: 'អ៊ីមែលនេះមានគណនីរួចហើយ សូមចូលគណនី' }, { status: 409 });
    }

    const joinMembership = body.joinMembership !== false;
    const user = createUser({
      name,
      email,
      passwordHash: await hashPassword(password),
      // Owner emails from ADMIN_EMAILS start as admins
      role: isOwnerEmail(email) ? 'admin' : 'student',
      isMember: joinMembership,
      memberSince: joinMembership ? new Date().toISOString() : undefined
    });

    await startSession(user);
    return NextResponse.json({ success: true, user: toSessionUser(user) });
  } catch (error) {
    console.error('Error signing up:', error);
    return NextResponse.json({ success: false, error: 'Failed to create account' }, { status: 500 });
  }
}
