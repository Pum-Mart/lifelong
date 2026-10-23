import { NextResponse } from 'next/server';
import { deleteSession, getCourseBySlug, getCourseStudents, saveSession } from '@/lib/db';
import { canManageCourse, requireStaff } from '@/lib/auth';
import { StudentDayRecord, TeacherStatus } from '@/types';
import { withDatabase } from '@/lib/store';

async function authorize(courseId: string) {
  const auth = await requireStaff();
  if ('response' in auth) return auth;
  const course = getCourseBySlug(courseId);
  if (!course) return { response: NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 }) };
  if (!canManageCourse(auth.user, course)) {
    return { response: NextResponse.json({ success: false, error: 'អ្នកមិនមែនជាគ្រូនៃវគ្គនេះទេ' }, { status: 403 }) };
  }
  return { user: auth.user, course };
}

const score = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : undefined;
};

// Body: { date, lessonTitle, teacherStatus, teacherNote, lessonCompleted, hasTest, hasExercise,
//         records: { [userId]: { present, testDone, testScore, exerciseDone, exerciseScore } } }
// Saving the same date again updates that day.
async function handlePOST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const auth = await authorize(courseId);
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const date = String(body.date ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, error: 'កាលបរិច្ឆេទមិនត្រឹមត្រូវ' }, { status: 400 });
    }
    const teacherStatus: TeacherStatus = ['present', 'absent', 'mission'].includes(body.teacherStatus) ? body.teacherStatus : 'present';

    // Only enrolled students; on teacher absence/mission days student marks are kept but not counted
    const records: Record<string, StudentDayRecord> = {};
    for (const student of getCourseStudents(auth.course.id)) {
      const r = body.records?.[student.id] || {};
      records[student.id] = {
        present: Boolean(r.present),
        testDone: Boolean(r.testDone),
        testScore: score(r.testScore),
        exerciseDone: Boolean(r.exerciseDone),
        exerciseScore: score(r.exerciseScore)
      };
    }

    const session = saveSession({
      courseId: auth.course.id,
      date,
      lessonTitle: String(body.lessonTitle ?? '').trim(),
      teacherStatus,
      teacherNote: String(body.teacherNote ?? '').trim() || undefined,
      lessonCompleted: Boolean(body.lessonCompleted),
      hasTest: Boolean(body.hasTest),
      hasExercise: Boolean(body.hasExercise),
      records,
      updatedBy: auth.user.name
    });
    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error saving session:', error);
    return NextResponse.json({ success: false, error: 'Failed to save session' }, { status: 500 });
  }
}

// ?id=<sessionId>
async function handleDELETE(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const auth = await authorize(courseId);
  if ('response' in auth) return auth.response;

  const id = new URL(request.url).searchParams.get('id') || '';
  const ok = deleteSession(auth.course.id, id);
  return NextResponse.json({ success: ok }, { status: ok ? 200 : 404 });
}

export const POST = withDatabase(handlePOST);
export const DELETE = withDatabase(handleDELETE);
