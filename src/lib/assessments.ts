import crypto from 'crypto';
import {
  createCertificateRequest,
  getAttempts,
  getCertificateRequestFor,
  getEnrollments,
  getExamScores,
  getRetakeRequestsFor,
  getSessions,
  getUsers,
  hasCertificate
} from '@/lib/db';
import { ASSESSMENT_BANK } from '@/lib/assessment-bank';
import { computeGrade, PASS_SCORE, SCHEME_WEIGHTS, schemeFor } from '@/lib/grades';
import { deliver } from '@/lib/reports';
import { escapeHtml, sendTelegramMessage } from '@/lib/telegram';
import { AssessmentKind, Course, GradeBreakdown, PublicQuestion, QuizQuestion, RetakeRequest, Standing } from '@/types';

// Server-only: question sets include the correct answers.

// Course as sent to browsers: lesson quizzes keep their questions but lose the answers,
// and custom pre-test/exam sets are removed entirely
export function publicCourse(course: Course): Course {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { assessments, ...rest } = course;
  return {
    ...rest,
    modules: course.modules.map(m => ({
      ...m,
      lessons: m.lessons.map(l => ({
        ...l,
        quiz: l.quiz?.map(q => ({ id: q.id, question: q.question, options: q.options, correctAnswer: -1, explanation: '' }))
      }))
    }))
  };
}

export function homeworkLessons(course: Course) {
  return course.modules.flatMap(m => m.lessons).filter(l => l.quiz && l.quiz.length > 0);
}

export function questionSet(course: Course, kind: AssessmentKind, lessonId?: string): QuizQuestion[] {
  if (kind === 'homework') return homeworkLessons(course).find(l => l.id === lessonId)?.quiz || [];
  const custom = kind === 'pretest' ? course.assessments?.preTest : course.assessments?.exam;
  if (custom && custom.length) return custom;
  const bank = ASSESSMENT_BANK[course.id];
  return (kind === 'pretest' ? bank?.preTest : bank?.exam) || [];
}

// Stable per-student shuffle of a question's options, so answers can't be guessed by position
function optionOrder(userId: string, questionId: string, count: number): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  let seed = crypto.createHash('sha256').update(`${userId}:${questionId}`).digest();
  for (let i = order.length - 1; i > 0; i--) {
    if (seed.length < 2) seed = crypto.createHash('sha256').update(seed).digest();
    const j = seed.readUInt16BE(0) % (i + 1);
    seed = seed.subarray(2);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order; // order[shownIndex] = original index
}

export function publicQuestions(userId: string, questions: QuizQuestion[]): PublicQuestion[] {
  return questions.map(q => {
    const order = optionOrder(userId, q.id, q.options.length);
    return { id: q.id, question: q.question, options: order.map(i => q.options[i]) };
  });
}

// answers: { [questionId]: shownIndex }. Unanswered questions count as wrong.
export function gradeAnswers(userId: string, questions: QuizQuestion[], answers: Record<string, number>) {
  const review = questions.map(q => {
    const order = optionOrder(userId, q.id, q.options.length);
    const shown = answers[q.id];
    const chosen = typeof shown === 'number' && shown >= 0 && shown < order.length ? order[shown] : -1;
    return {
      id: q.id,
      correct: chosen === q.correctAnswer,
      correctShownIndex: order.indexOf(q.correctAnswer),
      explanation: q.explanation
    };
  });
  const correct = review.filter(r => r.correct).length;
  const total = questions.length;
  return { correct, total, score: total ? Math.round((correct / total) * 1000) / 10 : 0, review };
}

const best = (scores: number[]) => (scores.length ? Math.max(...scores) : null);

export function standingFor(user: { id: string; name: string }, course: Course): Standing {
  const scheme = schemeFor(course);
  const attempts = getAttempts(user.id, course.id);
  const sessions = getSessions(course.id);
  const teacherExam = getExamScores(course.id).find(e => e.userId === user.id);
  const enrollment = getEnrollments(user.id).find(e => e.courseId === course.id);

  const preRequired = questionSet(course, 'pretest').length > 0;
  const preScore = best(attempts.filter(a => a.kind === 'pretest').map(a => a.score));

  const lessons = homeworkLessons(course);
  const perLesson: Record<string, number> = {};
  for (const lesson of lessons) {
    const b = best(attempts.filter(a => a.kind === 'homework' && a.lessonId === lesson.id).map(a => a.score));
    if (b !== null) perLesson[lesson.id] = b;
  }
  const onlineExam = best(attempts.filter(a => a.kind === 'exam').map(a => a.score));

  const grade = computeGrade(
    user.id,
    user.name,
    sessions,
    teacherExam,
    {
      preTest: preScore,
      // Lessons not yet done count as 0 so the score can't be inflated by skipping
      homework: lessons.map(l => perLesson[l.id] ?? 0),
      exam: onlineExam,
      lessonProgressPct: enrollment?.progressPercentage ?? 0
    },
    scheme
  );

  const examDone = Boolean(teacherExam) || onlineExam !== null;
  const homeworkDone = Object.keys(perLesson).length === lessons.length;
  const complete = (!preRequired || preScore !== null) && homeworkDone && examDone;

  return {
    scheme,
    weights: SCHEME_WEIGHTS[scheme],
    preTest: { required: preRequired, done: preScore !== null, score: preScore },
    homework: { lessonsTotal: lessons.length, lessonsDone: Object.keys(perLesson).length, score: grade.exercisePct, perLesson },
    attendance: { pct: grade.attendancePct, source: grade.countedDays > 0 ? 'class' : enrollment ? 'lessons' : 'none' },
    exam: { done: examDone, score: grade.examPct, source: teacherExam ? 'teacher' : onlineExam !== null ? 'online' : null },
    testPct: grade.testPct,
    exercisePct: grade.exercisePct,
    total: grade.total,
    complete,
    passScore: PASS_SCORE,
    passed: complete && (scheme === 'paid' || grade.total >= PASS_SCORE)
  };
}

// Grade row for class book screens, using the same rules as the standing
export function gradeForStudent(student: { id: string; name: string }, course: Course): GradeBreakdown {
  const s = standingFor(student, course);
  const sessions = getSessions(course.id);
  const days = sessions.filter(x => x.teacherStatus === 'present');
  return {
    userId: student.id,
    name: student.name,
    countedDays: days.length,
    presentDays: days.filter(x => x.records[student.id]?.present).length,
    attendancePct: s.scheme === 'paid' ? s.attendance.pct : null,
    testPct: s.testPct,
    exercisePct: s.exercisePct,
    examPct: s.exam.score,
    total: s.total
  };
}

// Each exam round allows this many attempts; another round needs an approved retake letter
export const EXAM_ATTEMPTS_PER_ROUND = 2;

export interface ExamAllowance {
  round: number; // current round (1 = first)
  used: number; // attempts used in the current round
  left: number;
  perRound: number;
  pendingRequest: RetakeRequest | null;
  lastRejected: RetakeRequest | null; // latest rejected letter, if it is the most recent one
}

export function examAllowance(userId: string, courseId: string): ExamAllowance {
  const requests = getRetakeRequestsFor(userId, courseId);
  const approved = requests.filter(r => r.status === 'approved').length;
  const round = 1 + approved;
  const totalUsed = getAttempts(userId, courseId).filter(a => a.kind === 'exam').length;
  const used = Math.max(0, totalUsed - approved * EXAM_ATTEMPTS_PER_ROUND);
  const last = requests[requests.length - 1] || null;
  return {
    round,
    used: Math.min(used, EXAM_ATTEMPTS_PER_ROUND),
    left: Math.max(0, EXAM_ATTEMPTS_PER_ROUND - used),
    perRound: EXAM_ATTEMPTS_PER_ROUND,
    pendingRequest: requests.find(r => r.status === 'pending') || null,
    lastRejected: last?.status === 'rejected' ? last : null
  };
}

export type CertificateState =
  | { state: 'incomplete' }
  | { state: 'retry'; total: number }
  | { state: 'pending'; requestId: string }
  | { state: 'rejected'; note?: string }
  | { state: 'issued'; certificateId: string };

export function certificateState(user: { id: string; email: string }, course: Course, standing: Standing): CertificateState {
  const cert = hasCertificate(user.email, course.id);
  if (cert) return { state: 'issued', certificateId: cert.id };
  const request = getCertificateRequestFor(user.id, course.id);
  if (request?.status === 'pending') return { state: 'pending', requestId: request.id };
  if (!standing.complete) return { state: 'incomplete' };
  if (!standing.passed) return { state: 'retry', total: standing.total };
  if (request?.status === 'rejected') return { state: 'rejected', note: request.reviewNote };
  return { state: 'incomplete' };
}

export function retryMessage(name: string) {
  return `សូម ${name} ព្យាយាមរៀនម្តងទៀត ដោយបានលើស ${PASS_SCORE} ពិន្ទុ ដើម្បីបានទទួលវិញ្ញាបនបត្រនេះ។`;
}

const KHMER_DIGITS = '០១២៣៤៥៦៧៨៩';
export const khmerNumber = (n: number) => String(n).replace(/\d/g, d => KHMER_DIGITS[Number(d)]);

// Called after every submission: once everything is done, either ask the director/committee
// to approve the certificate, or (free course below 65) tell the learner to try again.
export async function evaluateCertificate(
  user: { id: string; name: string; email: string },
  course: Course,
  justTookExam: boolean
): Promise<CertificateState> {
  const standing = standingFor(user, course);
  const current = certificateState(user, course, standing);
  if (current.state === 'issued' || current.state === 'pending') return current;
  if (!standing.complete) return current;

  const users = getUsers();
  const learner = users.find(u => u.id === user.id);

  if (!standing.passed) {
    if (justTookExam && learner) {
      await deliver(
        [learner],
        '📘 មិនទាន់គ្រប់លក្ខខណ្ឌទទួលវិញ្ញាបនបត្រ',
        `វគ្គ «${course.title}»\nពិន្ទុរបស់អ្នក៖ ${standing.total}/100 (កម្រិតមធ្យម ឬមិនល្អ)\n\n${retryMessage(user.name)}`
      );
    }
    return { state: 'retry', total: standing.total };
  }

  // A rejected request is only raised again after the learner retakes the exam
  if (current.state === 'rejected' && !justTookExam) return current;

  const request = createCertificateRequest({
    userId: user.id,
    name: user.name,
    email: user.email,
    courseId: course.id,
    courseTitle: course.title,
    scheme: standing.scheme,
    total: standing.total,
    breakdown: {
      testPct: standing.testPct ?? 0,
      exercisePct: standing.exercisePct ?? 0,
      attendancePct: standing.scheme === 'paid' ? standing.attendance.pct : null,
      examPct: standing.exam.score ?? 0
    }
  });

  const approvers = users.filter(u => u.staffTitle === 'director' || u.staffTitle === 'committee' || u.role === 'admin');
  const body = [
    `អ្នកសិក្សា៖ ${user.name} (${user.email})`,
    `វគ្គ៖ ${course.title} (${standing.scheme === 'paid' ? 'បង់ថ្លៃ' : 'ឥតគិតថ្លៃ'})`,
    `ពិន្ទុសរុប៖ ${standing.total}/100`,
    '',
    'បានបំពេញគ្រប់លក្ខខណ្ឌ។ សូមពិនិត្យ និងអនុម័ត ដើម្បីចេញវិញ្ញាបនបត្រ។'
  ].join('\n');
  await deliver(approvers, '🎓 ស្នើសុំអនុម័តវិញ្ញាបនបត្រ', body);
  await sendTelegramMessage(`🎓 <b>ស្នើសុំអនុម័តវិញ្ញាបនបត្រ</b>\n\n${escapeHtml(body)}`);
  if (learner) {
    await deliver([learner], '⏳ កំពុងរង់ចាំការអនុម័តវិញ្ញាបនបត្រ', `អ្នកបានបំពេញគ្រប់លក្ខខណ្ឌនៃវគ្គ «${course.title}»។ ប្រធានមជ្ឈមណ្ឌល ឬគណៈកម្មការនឹងអនុម័ត ហើយវិញ្ញាបនបត្រនឹងចេញជូនដោយស្វ័យប្រវត្តិ។`);
  }
  return { state: 'pending', requestId: request.id };
}
