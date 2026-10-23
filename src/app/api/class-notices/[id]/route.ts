import { NextResponse } from 'next/server';
import { deleteClassNotice, getClassNotices, getCourses } from '@/lib/db';
import { canManageCourse, requireStaff } from '@/lib/auth';

// Removes a notice from the lists; messages already delivered to inboxes stay
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if ('response' in auth) return auth.response;

  const { id } = await params;
  const notice = getClassNotices().find(n => n.id === id);
  if (!notice) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  const course = getCourses().find(c => c.id === notice.courseId);
  const allowed = auth.user.role === 'admin' || Boolean(course && canManageCourse(auth.user, course));
  if (!allowed) return NextResponse.json({ success: false, error: 'អ្នកមិនមានសិទ្ធិលុបទេ' }, { status: 403 });

  deleteClassNotice(id);
  return NextResponse.json({ success: true });
}
