import { NextResponse } from 'next/server';
import { addAttempt, getAttempts, getCourseBySlug, getEnrollments } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import {
  certificateState,
  evaluateCertificate,
  examAllowance,
  gradeAnswers,
  homeworkLessons,
  publicQuestions,
  questionSet,
  standingFor
} from '@/lib/assessments';
import { AssessmentKind } from '@/types';
import { withDatabase } from '@/lib/store';

async function authorize(courseId: string) {
  const auth = await requireUser();
  if ('response' in auth) return auth;
  const course = getCourseBySlug(courseId);
  if (!course) return { response: NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 }) };
  // Paid courses are only enrolled once their payment is approved
  if (!getEnrollments(auth.user.id).some(e => e.courseId === course.id)) {
    return {
      response: NextResponse.json(
        { success: false, error: course.price > 0 ? 'សូមបង់ប្រាក់ និងរង់ចាំការអនុម័តជាមុនសិន' : 'សូមចុះឈ្មោះចូលរៀនវគ្គនេះជាមុនសិន', notEnrolled: true },
        { status: 403 }
      )
    };
  }
  return { user: auth.user, course };
}

// The learner's standing, certificate state and the question sets (without answers)
async function handleGET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const auth = await authorize(courseId);
  if ('response' in auth) return auth.response;
  const { user, course } = auth;

  const standing = standingFor(user, course);
  const attempts = getAttempts(user.id, course.id);
  return NextResponse.json({
    success: true,
    course: { id: course.id, slug: course.slug, title: course.title, price: course.price },
    standing,
    certificate: certificateState(user, course, standing),
    preTest: questionSet(course, 'pretest').length ? publicQuestions(user.id, questionSet(course, 'pretest')) : [],
    exam: publicQuestions(user.id, questionSet(course, 'exam')),
    examAttempts: attempts.filter(a => a.kind === 'exam').length,
    examAllowance: examAllowance(user.id, course.id),
    homework: homeworkLessons(course).map(l => ({
      lessonId: l.id,
      title: l.title,
      questions: publicQuestions(user.id, l.quiz || []),
      best: standing.homework.perLesson[l.id] ?? null
    }))
  });
}

// Body: { kind: 'pretest' | 'homework' | 'exam', lessonId?, answers: { [questionId]: shownIndex } }
async function handlePOST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const auth = await authorize(courseId);
  if ('response' in auth) return auth.response;
  const { user, course } = auth;

  const body = await request.json();
  const kind = body.kind as AssessmentKind;
  if (!['pretest', 'homework', 'exam'].includes(kind)) {
    return NextResponse.json({ success: false, error: 'kind must be pretest, homework or exam' }, { status: 400 });
  }
  const questions = questionSet(course, kind, body.lessonId);
  if (questions.length === 0) {
    return NextResponse.json({ success: false, error: 'មិនមានសំណួរសម្រាប់ផ្នែកនេះទេ' }, { status: 404 });
  }

  // The pre-test is taken once, before studying
  if (kind === 'pretest' && getAttempts(user.id, course.id).some(a => a.kind === 'pretest')) {
    return NextResponse.json({ success: false, error: 'អ្នកបានធ្វើតេស្តមុនចូលរៀនរួចហើយ' }, { status: 409 });
  }

  // 2 exam attempts per round; another round needs an approved retake letter
  if (kind === 'exam' && examAllowance(user.id, course.id).left === 0) {
    return NextResponse.json(
      { success: false, error: 'អ្នកបានប្រឡងគ្រប់ចំនួនដងហើយ។ សូមដាក់លិខិតស្នើសុំប្រឡងម្តងទៀត។', retakeRequired: true },
      { status: 403 }
    );
  }

  const answers = typeof body.answers === 'object' && body.answers ? body.answers : {};
  const result = gradeAnswers(user.id, questions, answers);
  addAttempt({
    userId: user.id,
    courseId: course.id,
    kind,
    lessonId: kind === 'homework' ? body.lessonId : undefined,
    score: result.score,
    correct: result.correct,
    total: result.total
  });

  const certificate = await evaluateCertificate(user, course, kind === 'exam');
  return NextResponse.json({ success: true, result, standing: standingFor(user, course), certificate, examAllowance: examAllowance(user.id, course.id) });
}

export const GET = withDatabase(handleGET);
export const POST = withDatabase(handlePOST);
