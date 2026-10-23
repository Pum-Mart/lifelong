import { NextResponse } from 'next/server';
import { getCourseBySlug, getCourseStudents, saveExamScore } from '@/lib/db';
import { canManageCourse, requireStaff } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

// Body: { userId, score } — score 0-100, or null to clear
async function handlePUT(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const auth = await requireStaff();
  if ('response' in auth) return auth.response;

  const { courseId } = await params;
  const course = getCourseBySlug(courseId);
  if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
  if (!canManageCourse(auth.user, course)) {
    return NextResponse.json({ success: false, error: 'អ្នកមិនមែនជាគ្រូនៃវគ្គនេះទេ' }, { status: 403 });
  }

  const body = await request.json();
  if (!getCourseStudents(course.id).some(s => s.id === body.userId)) {
    return NextResponse.json({ success: false, error: 'សិស្សនេះមិនបានចុះឈ្មោះក្នុងវគ្គនេះទេ' }, { status: 400 });
  }
  let value: number | null = null;
  if (body.score !== null && body.score !== '' && body.score !== undefined) {
    value = Number(body.score);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return NextResponse.json({ success: false, error: 'ពិន្ទុប្រឡងត្រូវនៅចន្លោះ 0 ដល់ 100' }, { status: 400 });
    }
  }
  saveExamScore(course.id, body.userId, value);
  return NextResponse.json({ success: true });
}

export const PUT = withDatabase(handlePUT);
