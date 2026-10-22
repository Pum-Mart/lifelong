import crypto from 'crypto';
import { promisify } from 'util';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getUserById } from '@/lib/db';
import { SessionUser, UserAccount } from '@/types';

const scrypt = promisify(crypto.scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

export const SESSION_COOKIE = 'llc_session';
const SESSION_DAYS = 30;

// ---------- Passwords ----------

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hashHex] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

export function validatePassword(password: string): string | null {
  return password.length >= 8 ? null : 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៨ តួអក្សរ';
}

// ---------- Owners (admins configured in .env.local) ----------

export function ownerEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwnerEmail(email: string): boolean {
  return ownerEmails().includes(email.toLowerCase());
}

export function toSessionUser(user: UserAccount): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isMember: user.isMember,
    isOwner: isOwnerEmail(user.email),
    memberSince: user.memberSince,
    createdAt: user.createdAt,
    instructorId: user.instructorId,
    staffTitle: user.staffTitle,
    telegramLinked: Boolean(user.telegramChatId)
  };
}

// Admins manage every class; a teacher manages the courses of their own teacher profile
export function canManageCourse(user: SessionUser, course: { instructorId: string }): boolean {
  return user.role === 'admin' || (user.role === 'teacher' && Boolean(user.instructorId) && user.instructorId === course.instructorId);
}

// Printed under the approver's signature on certificates
export function approverTitle(user: SessionUser): string {
  if (user.staffTitle === 'director') return 'ប្រធានមជ្ឈមណ្ឌល (Center Director)';
  if (user.staffTitle === 'committee') return 'គណៈកម្មការមជ្ឈមណ្ឌល (Committee)';
  return 'អ្នកគ្រប់គ្រង (Administrator)';
}

// Final approval of results and certificates: the centre director, any committee member, or an admin
export function canApproveResults(user: SessionUser): boolean {
  return user.staffTitle === 'director' || user.staffTitle === 'committee' || user.role === 'admin';
}

export async function requireStaff(): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const result = await requireUser();
  if ('response' in result) return result;
  if (result.user.role !== 'admin' && result.user.role !== 'teacher') {
    return { response: NextResponse.json({ success: false, error: 'សម្រាប់គ្រូ និងអ្នកគ្រប់គ្រងតែប៉ុណ្ណោះ' }, { status: 403 }) };
  }
  return result;
}

// ---------- Session cookie: base64url(payload).hmac ----------

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error('AUTH_SECRET must be set in .env.local (at least 32 characters)');
  }
  return value;
}

function sign(data: string): string {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

export async function startSession(user: UserAccount) {
  const payload = Buffer.from(
    JSON.stringify({ uid: user.id, v: user.sessionVersion, exp: Date.now() + SESSION_DAYS * 86400_000 })
  ).toString('base64url');
  const store = await cookies();
  store.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 86400
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionAccount(): Promise<UserAccount | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [payload, signature] = raw.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;

  try {
    const { uid, v, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof exp !== 'number' || exp < Date.now()) return null;
    const user = getUserById(uid);
    if (!user || user.sessionVersion !== v) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const account = await getSessionAccount();
  return account ? toSessionUser(account) : null;
}

// Route handler guards: return either the user or a ready-made error response
export async function requireUser(): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getSessionUser();
  if (!user) {
    return { response: NextResponse.json({ success: false, error: 'សូមចូលគណនីជាមុនសិន', loginRequired: true }, { status: 401 }) };
  }
  return { user };
}

export async function requireAdmin(): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const result = await requireUser();
  if ('response' in result) return result;
  if (result.user.role !== 'admin') {
    return { response: NextResponse.json({ success: false, error: 'សម្រាប់អ្នកគ្រប់គ្រងតែប៉ុណ្ណោះ' }, { status: 403 }) };
  }
  return result;
}

// ---------- Login throttling (per email, in memory) ----------

const failedLogins = new Map<string, { count: number; until: number }>();
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60_000;

export function loginLockedFor(email: string): number {
  const entry = failedLogins.get(email);
  if (!entry || entry.count < MAX_FAILURES) return 0;
  const remaining = entry.until - Date.now();
  if (remaining <= 0) {
    failedLogins.delete(email);
    return 0;
  }
  return remaining;
}

export function recordLoginFailure(email: string) {
  const entry = failedLogins.get(email) || { count: 0, until: 0 };
  entry.count += 1;
  entry.until = Date.now() + LOCK_MS;
  failedLogins.set(email, entry);
}

export function clearLoginFailures(email: string) {
  failedLogins.delete(email);
}
