import { NextResponse } from 'next/server';
import { getCourseBySlug, saveCourseAssessments } from '@/lib/db';
import { canManageCourse, requireStaff } from '@/lib/auth';
import { questionSet } from '@/lib/assessments';
import { QuizQuestion } from '@/types';

async function authorize(courseId: string) {
  const auth = await requireStaff();
  if ('response' in auth) return auth;
  const course = getCourseBySlug(courseId);
  if (!course) return { response: NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 }) };
  if (!canManageCourse(auth.user, course)) {
    return { response: NextResponse.json({ success: false, error: 'អ្នកមិនមែនជាគ្រូនៃវគ្គនេះទេ' }, { status: 403 }) };
  }
  return { course };
}

// Full questions (with answers) for the teacher's editor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const auth = await authorize(courseId);
  if ('response' in auth) return auth.response;
  return NextResponse.json({
    success: true,
    preTest: questionSet(auth.course, 'pretest'),
    exam: questionSet(auth.course, 'exam'),
    homeworkLessons: auth.course.modules.flatMap(m => m.lessons).filter(l => l.quiz?.length).length
  });
}

function clean(list: unknown, prefix: string): QuizQuestion[] | string {
  if (!Array.isArray(list)) return 'ទិន្នន័យមិនត្រឹមត្រូវ';
  const out: QuizQuestion[] = [];
  for (const [i, raw] of list.entries()) {
    const q = raw as Partial<QuizQuestion>;
    const question = String(q.question ?? '').trim();
    const options = Array.isArray(q.options) ? q.options.map(o => String(o).trim()).filter(Boolean) : [];
    const correct = Number(q.correctAnswer);
    if (!question) return `សំណួរទី ${i + 1}៖ សូមបញ្ចូលសំណួរ`;
    if (options.length < 2) return `សំណួរទី ${i + 1}៖ ត្រូវមានជម្រើសយ៉ាងតិច ២`;
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) return `សំណួរទី ${i + 1}៖ សូមជ្រើសចម្លើយត្រឹមត្រូវ`;
    out.push({
      id: String(q.id || `${prefix}-${Date.now()}-${i}`),
      question,
      options,
      correctAnswer: correct,
      explanation: String(q.explanation ?? '').trim()
    });
  }
  return out;
}

// Body: { preTest: QuizQuestion[], exam: QuizQuestion[] }
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const auth = await authorize(courseId);
  if ('response' in auth) return auth.response;

  const body = await request.json();
  const preTest = clean(body.preTest, 'pre');
  const exam = clean(body.exam, 'exam');
  if (typeof preTest === 'string') return NextResponse.json({ success: false, error: `តេស្តមុនចូលរៀន — ${preTest}` }, { status: 400 });
  if (typeof exam === 'string') return NextResponse.json({ success: false, error: `ប្រឡង — ${exam}` }, { status: 400 });
  if (exam.length === 0) return NextResponse.json({ success: false, error: 'ប្រឡងត្រូវមានសំណួរយ៉ាងតិចមួយ' }, { status: 400 });

  saveCourseAssessments(auth.course.id, { preTest, exam });
  return NextResponse.json({ success: true, preTest, exam });
}
