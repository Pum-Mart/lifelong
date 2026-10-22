import { NextResponse } from 'next/server';
import { getCompletion, getCourseBySlug, getCourseStudents, getUsers, saveCompletion } from '@/lib/db';
import { canManageCourse, requireStaff } from '@/lib/auth';
import { PASS_SCORE, SCHEME_WEIGHTS, schemeFor, weightedTotal } from '@/lib/grades';
import { gradeForStudent } from '@/lib/assessments';
import { Course, GradingScheme } from '@/types';
import { deliver } from '@/lib/reports';
import { sendTelegramMessage, escapeHtml } from '@/lib/telegram';
import { CompletionResult, CourseCompletion } from '@/types';

// Free courses: certificate from 65; paid courses: every learner receives one
const passes = (scheme: GradingScheme, total: number) => scheme === 'paid' || total >= PASS_SCORE;

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

// Results pulled automatically from attendance, daily tests, exercises and the exam
function computedResults(course: Course): CompletionResult[] {
  const scheme = schemeFor(course);
  return getCourseStudents(course.id).map(s => {
    const g = gradeForStudent(s, course);
    const parts = { attendancePct: g.attendancePct ?? 0, testPct: g.testPct ?? 0, exercisePct: g.exercisePct ?? 0, examPct: g.examPct ?? 0 };
    const total = weightedTotal(parts, scheme);
    return { userId: s.id, name: s.name, email: s.email, ...parts, total, passed: passes(scheme, total) };
  });
}

// The saved sheet, or a fresh draft computed from the class book. ?recompute=1 re-pulls the scores.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const auth = await authorize(courseId);
  if ('response' in auth) return auth.response;

  const saved = getCompletion(auth.course.id);
  const recompute = new URL(request.url).searchParams.get('recompute') === '1';
  const completion: CourseCompletion =
    saved && !(recompute && (saved.status === 'draft' || saved.status === 'rejected'))
      ? saved
      : {
          courseId: auth.course.id,
          courseTitle: auth.course.title,
          instructorName: auth.course.instructor?.name || '',
          status: saved?.status === 'rejected' ? 'rejected' : 'draft',
          courseCompleted: saved?.courseCompleted ?? false,
          reviewNote: saved?.reviewNote,
          results: computedResults(auth.course),
          updatedAt: new Date().toISOString()
        };
  const scheme = schemeFor(auth.course);
  return NextResponse.json({ success: true, completion, passScore: PASS_SCORE, scheme, weights: SCHEME_WEIGHTS[scheme], endDate: auth.course.endDate });
}

const pct = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 10) / 10 : null;
};

// Body: { courseCompleted, results: [{ userId, attendancePct, testPct, exercisePct, examPct }], submit }
// submit: true sends the sheet to the centre director for approval.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const auth = await authorize(courseId);
  if ('response' in auth) return auth.response;
  const { user, course } = auth;

  const existing = getCompletion(course.id);
  if (existing && (existing.status === 'submitted' || existing.status === 'approved')) {
    return NextResponse.json({ success: false, error: existing.status === 'approved' ? 'លទ្ធផលត្រូវបានអនុម័តរួចហើយ' : 'កំពុងរង់ចាំការអនុម័តពីប្រធានមជ្ឈមណ្ឌល' }, { status: 409 });
  }

  const body = await request.json();
  const students = getCourseStudents(course.id);
  const incoming = new Map<string, Record<string, unknown>>((body.results || []).map((r: Record<string, unknown>) => [String(r.userId), r]));
  const results: CompletionResult[] = [];
  for (const s of students) {
    const r = incoming.get(s.id) || {};
    const parts = { attendancePct: pct(r.attendancePct), testPct: pct(r.testPct), exercisePct: pct(r.exercisePct), examPct: pct(r.examPct) };
    if (Object.values(parts).some(v => v === null)) {
      return NextResponse.json({ success: false, error: `ពិន្ទុរបស់ ${s.name} ត្រូវនៅចន្លោះ 0 ដល់ 100` }, { status: 400 });
    }
    const clean = parts as { attendancePct: number; testPct: number; exercisePct: number; examPct: number };
    const total = weightedTotal(clean, schemeFor(course)); // always recomputed here, never trusted from the browser
    results.push({ userId: s.id, name: s.name, email: s.email, ...clean, total, passed: passes(schemeFor(course), total) });
  }

  const submit = Boolean(body.submit);
  const courseCompleted = Boolean(body.courseCompleted);
  if (submit && !courseCompleted) {
    return NextResponse.json({ success: false, error: 'សូមធីក «បានបញ្ចប់វគ្គ» ជាមុនសិន' }, { status: 400 });
  }
  if (submit && results.length === 0) {
    return NextResponse.json({ success: false, error: 'មិនមានសិស្សក្នុងវគ្គនេះទេ' }, { status: 400 });
  }

  const completion = saveCompletion({
    courseId: course.id,
    courseTitle: course.title,
    instructorName: course.instructor?.name || '',
    status: submit ? 'submitted' : existing?.status === 'rejected' ? 'rejected' : 'draft',
    courseCompleted,
    results,
    submittedBy: submit ? user.name : existing?.submittedBy,
    submittedAt: submit ? new Date().toISOString() : existing?.submittedAt,
    reviewNote: submit ? undefined : existing?.reviewNote,
    updatedAt: new Date().toISOString()
  });

  if (submit) {
    const passed = results.filter(r => r.passed).length;
    const body = [
      `វគ្គ៖ ${course.title}`,
      `គ្រូ៖ ${course.instructor?.name || user.name} (បញ្ជូនដោយ ${user.name})`,
      `សិស្ស ${results.length} នាក់ • ជាប់ ${passed} • ធ្លាក់ ${results.length - passed}`,
      '',
      ...results.map(r => `${r.passed ? '✅' : '❌'} ${r.name}: ${r.total}/100`),
      '',
      'សូមពិនិត្យ និងអនុម័ត ដើម្បីចេញវិញ្ញាបនបត្រ។'
    ].join('\n');
    const approvers = getUsers().filter(u => u.staffTitle === 'director' || u.role === 'admin');
    await deliver(approvers, '📝 ស្នើសុំអនុម័តលទ្ធផលវគ្គ', body);
    await sendTelegramMessage(`📝 <b>ស្នើសុំអនុម័តលទ្ធផលវគ្គ</b>\n\n${escapeHtml(body)}`);
  }

  return NextResponse.json({ success: true, completion });
}
