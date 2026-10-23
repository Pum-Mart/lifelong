import { NextResponse } from 'next/server';
import { getEnrollments, enrollStudent, getCourseBySlug } from '@/lib/db';
import { notifyNewOrder } from '@/lib/telegram';
import { requireUser } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

// ?scope=all lists everyone's enrollments (admins only); otherwise the user's own
async function handleGET(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  try {
    const all = new URL(request.url).searchParams.get('scope') === 'all';
    if (all && auth.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'សម្រាប់អ្នកគ្រប់គ្រងតែប៉ុណ្ណោះ' }, { status: 403 });
    }
    const enrollments = getEnrollments(all ? undefined : auth.user.id);
    return NextResponse.json({ success: true, enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

// Body: { courseId }. Enrolls the signed-in user in a free course.
async function handlePOST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { user } = auth;

  try {
    const { courseId } = await request.json();
    const course = courseId ? getCourseBySlug(courseId) : null;
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const alreadyEnrolled = getEnrollments(user.id).some(e => e.courseId === course.id);

    // Paid courses unlock only through an approved payment (/api/payments)
    if (!alreadyEnrolled && course.price > 0) {
      return NextResponse.json({ success: false, error: 'Payment required', paymentRequired: true }, { status: 402 });
    }

    const enrollment = enrollStudent(user.id, course.id, user.name, user.email);

    if (!alreadyEnrolled && enrollment.course) {
      await notifyNewOrder({
        studentName: user.name,
        studentEmail: user.email,
        courseTitle: enrollment.course.title,
        amount: enrollment.course.price
      });
    }

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error('Error enrolling student:', error);
    return NextResponse.json({ success: false, error: 'Failed to enroll student' }, { status: 500 });
  }
}

export const GET = withDatabase(handleGET);
export const POST = withDatabase(handlePOST);
