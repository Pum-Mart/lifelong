import { NextResponse } from 'next/server';
import { getInstructors, getUserById, updateUser } from '@/lib/db';
import { isOwnerEmail, requireAdmin, toSessionUser } from '@/lib/auth';

// Body: { role?: 'student' | 'teacher' | 'admin', instructorId?: string, staffTitle?: 'director' | 'committee' | null, isMember?: boolean }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;
    const target = getUserById(id);
    if (!target) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const changes: Parameters<typeof updateUser>[1] = {};

    if (body.role !== undefined) {
      if (!['student', 'teacher', 'admin'].includes(body.role)) {
        return NextResponse.json({ success: false, error: 'role must be student, teacher or admin' }, { status: 400 });
      }
      if (body.role !== 'admin' && isOwnerEmail(target.email)) {
        return NextResponse.json({ success: false, error: 'មិនអាចដកសិទ្ធិម្ចាស់គេហទំព័របានទេ' }, { status: 403 });
      }
      if (body.role !== 'admin' && target.id === auth.user.id) {
        return NextResponse.json({ success: false, error: 'មិនអាចដកសិទ្ធិ admin ពីខ្លួនឯងបានទេ' }, { status: 400 });
      }
      if (body.role === 'teacher') {
        // A teacher account must be tied to a teacher profile to know which classes it manages
        const instructorId = String(body.instructorId ?? target.instructorId ?? '');
        if (!getInstructors().some(i => i.id === instructorId)) {
          return NextResponse.json({ success: false, error: 'សូមជ្រើសរើសប្រវត្តិរូបគ្រូ' }, { status: 400 });
        }
        changes.instructorId = instructorId;
      } else {
        changes.instructorId = undefined;
      }
      changes.role = body.role;
      // Changing role signs the user out of existing sessions
      if (body.role !== target.role) changes.sessionVersion = target.sessionVersion + 1;
    }

    if (body.staffTitle !== undefined) {
      if (body.staffTitle !== null && body.staffTitle !== 'director' && body.staffTitle !== 'committee') {
        return NextResponse.json({ success: false, error: 'staffTitle must be director, committee or null' }, { status: 400 });
      }
      changes.staffTitle = body.staffTitle || undefined;
    }

    if (typeof body.isMember === 'boolean' && body.isMember !== target.isMember) {
      changes.isMember = body.isMember;
      changes.memberSince = body.isMember ? new Date().toISOString() : undefined;
    }

    const updated = updateUser(id, changes);
    return NextResponse.json({ success: true, user: updated ? toSessionUser(updated) : null });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}
