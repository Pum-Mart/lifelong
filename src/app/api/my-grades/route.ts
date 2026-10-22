import { NextResponse } from 'next/server';
import { getCourses, getEnrollments, getSessions } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { countedSessions, SCHEME_WEIGHTS, schemeFor } from '@/lib/grades';
import { gradeForStudent } from '@/lib/assessments';

// The signed-in student's attendance, daily checklist and grade for each enrolled course
export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { user } = auth;

  const courses = getCourses();
  const results = getEnrollments(user.id)
    .map(e => courses.find(c => c.id === e.courseId))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map(course => {
      const sessions = getSessions(course.id);
      if (sessions.length === 0) return null;
      const counted = new Set(countedSessions(sessions).map(s => s.id));
      return {
        courseId: course.id,
        courseTitle: course.title,
        endDate: course.endDate,
        scheme: schemeFor(course),
        weights: SCHEME_WEIGHTS[schemeFor(course)],
        grade: gradeForStudent(user, course),
        // Only this student's own marks — never other students'
        days: sessions.map(s => ({
          date: s.date,
          lessonTitle: s.lessonTitle,
          teacherStatus: s.teacherStatus,
          counted: counted.has(s.id),
          lessonCompleted: s.lessonCompleted,
          hasTest: s.hasTest,
          hasExercise: s.hasExercise,
          record: s.records[user.id] || null
        }))
      };
    })
    .filter(Boolean);

  return NextResponse.json({ success: true, courses: results });
}
