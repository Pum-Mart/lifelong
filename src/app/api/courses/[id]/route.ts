import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { publicCourse } from '@/lib/assessments';
import { getCourseBySlug, saveCourse, deleteCourse, getInstructors, getCourses } from '@/lib/db';
import { Course } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = getCourseBySlug(id);
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, course: publicCourse(course) });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch course' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const existing = getCourseBySlug(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Only admin-editable fields; anything else in the body is ignored
    const text = (key: string) => (typeof body[key] === 'string' && body[key].trim() ? body[key].trim() : undefined);
    const num = (key: string) => (body[key] === undefined || body[key] === '' ? undefined : Number(body[key]));

    const price = num('price');
    const originalPrice = num('originalPrice');
    const ceus = num('ceus');
    for (const [label, value] of [['price', price], ['originalPrice', originalPrice], ['ceus', ceus]] as const) {
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
        return NextResponse.json({ success: false, error: `${label} must be a number ≥ 0` }, { status: 400 });
      }
    }

    // Dates: 'YYYY-MM-DD', or '' to clear
    const DATE = /^\d{4}-\d{2}-\d{2}$/;
    const dateField = (key: 'startDate' | 'endDate') => (body[key] === undefined ? undefined : String(body[key]).trim());
    const startDate = dateField('startDate');
    const endDate = dateField('endDate');
    for (const value of [startDate, endDate]) {
      if (value && !DATE.test(value)) {
        return NextResponse.json({ success: false, error: 'កាលបរិច្ឆេទមិនត្រឹមត្រូវ' }, { status: 400 });
      }
    }
    const finalStart = startDate === undefined ? existing.startDate : startDate || undefined;
    const finalEnd = endDate === undefined ? existing.endDate : endDate || undefined;
    if (finalStart && finalEnd && finalEnd < finalStart) {
      return NextResponse.json({ success: false, error: 'ថ្ងៃបញ្ចប់ត្រូវនៅក្រោយថ្ងៃចាប់ផ្តើម' }, { status: 400 });
    }

    const instructorId = text('instructorId');
    if (instructorId && !getInstructors().some(i => i.id === instructorId)) {
      return NextResponse.json({ success: false, error: 'Instructor not found' }, { status: 400 });
    }

    // Cover image: an uploaded file (/api/uploads/...) or an https URL
    const thumbnail = text('thumbnail');
    if (thumbnail && !thumbnail.startsWith('/api/uploads/') && !/^https:\/\//.test(thumbnail)) {
      return NextResponse.json({ success: false, error: 'រូបភាពគម្របមិនត្រឹមត្រូវ' }, { status: 400 });
    }

    // Modules & lessons: lesson quizzes (homework) are kept from the saved lesson with the same id
    let modules = existing.modules;
    if (body.modules !== undefined) {
      if (!Array.isArray(body.modules)) return NextResponse.json({ success: false, error: 'modules must be a list' }, { status: 400 });
      const savedLessons = new Map(existing.modules.flatMap(m => m.lessons).map(l => [l.id, l]));
      const str = (v: unknown) => String(v ?? '').trim();
      modules = [];
      for (const [mi, m] of body.modules.entries()) {
        const title = str(m?.title);
        if (!title) return NextResponse.json({ success: false, error: `ជំពូកទី ${mi + 1}៖ សូមបញ្ចូលចំណងជើង` }, { status: 400 });
        const lessons = [];
        for (const [li, l] of (Array.isArray(m?.lessons) ? m.lessons : []).entries()) {
          const lessonTitle = str(l?.title);
          if (!lessonTitle) return NextResponse.json({ success: false, error: `ជំពូកទី ${mi + 1} មេរៀនទី ${li + 1}៖ សូមបញ្ចូលចំណងជើង` }, { status: 400 });
          const videoUrl = str(l?.videoUrl);
          if (videoUrl && !/^https?:\/\//.test(videoUrl)) {
            return NextResponse.json({ success: false, error: `មេរៀន «${lessonTitle}»៖ តំណវីដេអូមិនត្រឹមត្រូវ` }, { status: 400 });
          }
          const lessonId = str(l?.id) || `les-${Date.now()}-${mi}-${li}`;
          const saved = savedLessons.get(lessonId);
          lessons.push({
            id: lessonId,
            title: lessonTitle,
            duration: str(l?.duration) || '15 នាទី',
            summary: str(l?.summary),
            content: str(l?.content) ? str(l?.content).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean) : undefined,
            notes: str(l?.notes),
            activity: str(l?.activity) || undefined,
            videoUrl: videoUrl || undefined,
            isFreePreview: Boolean(l?.isFreePreview),
            quiz: saved?.quiz
          });
        }
        modules.push({ id: str(m?.id) || `mod-${Date.now()}-${mi}`, title, description: str(m?.description), lessons });
      }
    }

    const updated = {
      ...existing,
      modules,
      lecturesCount: modules.reduce((n, m) => n + m.lessons.length, 0) || existing.lecturesCount,
      ...(text('title') && { title: text('title') }),
      ...(text('subtitle') !== undefined && { subtitle: text('subtitle') }),
      ...(text('description') !== undefined && { description: text('description') }),
      ...(text('category') && { category: text('category') }),
      ...(text('level') && { level: text('level') }),
      ...(text('format') && { format: text('format') }),
      ...(text('duration') && { duration: text('duration') }),
      ...(text('thumbnail') && { thumbnail: text('thumbnail') }),
      ...(instructorId && { instructorId }),
      ...(price !== undefined && { price }),
      ...(originalPrice !== undefined && { originalPrice }),
      ...(ceus !== undefined && { ceus }),
      startDate: finalStart,
      endDate: finalEnd,
      // A new end date means the "course ended" notice should go out again
      endNoticeSentAt: finalEnd === existing.endDate ? existing.endNoticeSentAt : undefined,
      id: existing.id,
      updatedAt: new Date().toISOString().split('T')[0]
    } as Course;

    saveCourse(updated);
    return NextResponse.json({ success: true, course: getCourses().find(c => c.id === existing.id) });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ success: false, error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;
    const course = getCourseBySlug(id);
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }
    deleteCourse(course.id);
    return NextResponse.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete course' }, { status: 500 });
  }
}
