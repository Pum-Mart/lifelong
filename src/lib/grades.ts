import { ClassSession, ExamScore, GradeBreakdown, GradingScheme } from '@/types';

// Final-score weights (each set adds up to 100).
// Free courses: pre-test, homework/exercises, exam. Paid courses add attendance.
export const SCHEME_WEIGHTS: Record<GradingScheme, { test: number; exercise: number; attendance: number; exam: number }> = {
  free: { test: 15, exercise: 35, attendance: 0, exam: 50 },
  paid: { test: 10, exercise: 20, attendance: 40, exam: 30 }
};

// Kept for screens that describe the classroom (paid) weighting
export const GRADE_WEIGHTS = SCHEME_WEIGHTS.paid;

export const schemeFor = (course: { price: number }): GradingScheme => (course.price > 0 ? 'paid' : 'free');

// Free courses: a certificate needs at least this score ("ល្អ"). Paid learners always receive one.
export const PASS_SCORE = 65;

// Only days the teacher actually taught count; absent/mission days are skipped entirely
export function countedSessions(sessions: ClassSession[]): ClassSession[] {
  return sessions.filter(s => s.teacherStatus === 'present');
}

const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
const round1 = (n: number) => Math.round(n * 10) / 10;

function itemScore(done: boolean, score?: number): number {
  if (!done) return 0;
  return typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 100;
}

export function weightedTotal(
  parts: { attendancePct: number; testPct: number; exercisePct: number; examPct: number },
  scheme: GradingScheme = 'paid'
): number {
  const w = SCHEME_WEIGHTS[scheme];
  return round1(
    (parts.attendancePct * w.attendance + parts.testPct * w.test + parts.exercisePct * w.exercise + parts.examPct * w.exam) / 100
  );
}

// Online work that counts alongside the class book
export interface OnlineScores {
  preTest?: number | null; // pre-test score
  homework?: number[]; // best score of each lesson quiz taken
  exam?: number | null; // best online exam score
  lessonProgressPct?: number | null; // stands in for attendance when there are no class days
}

export function computeGrade(
  userId: string,
  name: string,
  sessions: ClassSession[],
  exam?: ExamScore,
  online: OnlineScores = {},
  scheme: GradingScheme = 'paid'
): GradeBreakdown {
  const days = countedSessions(sessions);
  const records = days.map(s => s.records[userId]);

  const presentDays = records.filter(r => r?.present).length;
  const attendancePct = days.length ? (presentDays / days.length) * 100 : (online.lessonProgressPct ?? null);

  // Test = pre-test plus any class daily tests; exercises = lesson homework plus class exercises
  const testPct = average([
    ...(typeof online.preTest === 'number' ? [online.preTest] : []),
    ...days.filter(s => s.hasTest).map(s => itemScore(Boolean(s.records[userId]?.testDone), s.records[userId]?.testScore))
  ]);
  const exercisePct = average([
    ...(online.homework || []),
    ...days.filter(s => s.hasExercise).map(s => itemScore(Boolean(s.records[userId]?.exerciseDone), s.records[userId]?.exerciseScore))
  ]);
  // A score entered by the teacher takes precedence over the online exam
  const examPct = exam ? exam.score : typeof online.exam === 'number' ? online.exam : null;

  const total = weightedTotal(
    { attendancePct: attendancePct ?? 0, testPct: testPct ?? 0, exercisePct: exercisePct ?? 0, examPct: examPct ?? 0 },
    scheme
  );

  return {
    userId,
    name,
    countedDays: days.length,
    presentDays,
    attendancePct: attendancePct === null ? null : round1(attendancePct),
    testPct: testPct === null ? null : round1(testPct),
    exercisePct: exercisePct === null ? null : round1(exercisePct),
    examPct,
    total
  };
}

// What a student left undone across the given sessions (for the weekly letter)
export function missingItems(userId: string, sessions: ClassSession[]): string[] {
  const missing: string[] = [];
  for (const s of countedSessions(sessions).sort((a, b) => a.date.localeCompare(b.date))) {
    const r = s.records[userId];
    const day = `${s.date}${s.lessonTitle ? ` (${s.lessonTitle})` : ''}`;
    if (!r?.present) missing.push(`អវត្តមាន ${day}`);
    if (s.hasTest && !r?.testDone) missing.push(`មិនបានធ្វើតេស្ត ${day}`);
    if (s.hasExercise && !r?.exerciseDone) missing.push(`មិនបានធ្វើលំហាត់ ${day}`);
  }
  return missing;
}

// ≥ 65 is "good" and earns a free-course certificate; below is "average or poor"
export function gradeLabel(total: number): string {
  if (total >= 90) return 'ល្អប្រសើរ';
  if (total >= 80) return 'ល្អណាស់';
  if (total >= PASS_SCORE) return 'ល្អ';
  if (total >= 50) return 'មធ្យម';
  return 'មិនល្អ';
}
