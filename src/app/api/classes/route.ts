import { NextResponse } from 'next/server';
import { getCourses } from '@/lib/db';
import { canManageCourse, requireStaff } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

// Courses the signed-in teacher/admin can take attendance for
async function handleGET() {
  const auth = await requireStaff();
  if ('response' in auth) return auth.response;
  const courses = getCourses()
    .filter(c => canManageCourse(auth.user, c))
    .map(c => ({ id: c.id, title: c.title, instructorName: c.instructor?.name, startDate: c.startDate, endDate: c.endDate }));
  return NextResponse.json({ success: true, courses });
}

export const GET = withDatabase(handleGET);
