import { NextResponse } from 'next/server';
import { updateLessonProgress } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

// Body: { courseId, lessonId, completed } for the signed-in user
async function handlePOST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { user } = auth;

  try {
    const body = await request.json();
    const { courseId, lessonId, completed } = body;

    if (!courseId || !lessonId) {
      return NextResponse.json({ success: false, error: 'courseId and lessonId are required' }, { status: 400 });
    }

    const result = updateLessonProgress(user.id, courseId, lessonId, Boolean(completed), { name: user.name, email: user.email });
    return NextResponse.json({
      success: true,
      enrollment: result.enrollment,
      newCertificate: result.newCertificate || null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update lesson progress';
    if (message === 'Payment required') {
      return NextResponse.json({ success: false, error: message, paymentRequired: true }, { status: 402 });
    }
    console.error('Error updating lesson progress:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const POST = withDatabase(handlePOST);
