import { NextResponse } from 'next/server';
import { getCourseBySlug, getCourseStudents, getExamScores, getSessions } from '@/lib/db';
import { canManageCourse, requireStaff } from '@/lib/auth';
import { gradeForStudent } from '@/lib/assessments';
import { SCHEME_WEIGHTS, schemeFor } from '@/lib/grades';
import { withDatabase } from '@/lib/store';

// Class book of one course: roster, daily sessions, exam scores and computed grades
async function handleGET(
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

  const students = getCourseStudents(course.id);
  const sessions = getSessions(course.id);
  const exams = getExamScores(course.id);
  // Includes online pre-test, homework and exam alongside the class book
  const grades = students.map(s => gradeForStudent(s, course));

  return NextResponse.json({
    success: true,
    course: { id: course.id, title: course.title, instructorName: course.instructor?.name, startDate: course.startDate, endDate: course.endDate, scheme: schemeFor(course), weights: SCHEME_WEIGHTS[schemeFor(course)] },
    students,
    sessions,
    exams,
    grades
  });
}

export const GET = withDatabase(handleGET);
