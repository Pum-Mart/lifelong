import { NextResponse } from 'next/server';
import { getCourseBySlug, getEnrollments, getRegistrations, createRegistration } from '@/lib/db';
import { imageFrom, saveImage, validateImage } from '@/lib/uploads';
import { notifyNewRegistration } from '@/lib/telegram';
import { requireUser } from '@/lib/auth';
import { withDatabase } from '@/lib/store';

// ?scope=all lists every registration (admins only); otherwise the user's own
async function handleGET(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  try {
    const all = new URL(request.url).searchParams.get('scope') === 'all';
    if (all && auth.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'សម្រាប់អ្នកគ្រប់គ្រងតែប៉ុណ្ណោះ' }, { status: 403 });
    }
    return NextResponse.json({ success: true, registrations: getRegistrations(all ? undefined : auth.user.id) });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch registrations' }, { status: 500 });
  }
}

// Multipart form: courseId, fullNameKh, fullNameEn, gender, dateOfBirth, phone,
// address, telegramUsername, photo (4x6 portrait image). For the signed-in user.
async function handlePOST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  try {
    const form = await request.formData();
    const field = (name: string) => String(form.get(name) ?? '').trim();

    const userId = auth.user.id;
    const course = getCourseBySlug(field('courseId'));
    if (!course) {
      return NextResponse.json({ success: false, error: 'រកមិនឃើញវគ្គសិក្សា' }, { status: 404 });
    }

    // Paid courses are only enrolled after their payment is approved
    if (!getEnrollments(userId).some(e => e.courseId === course.id)) {
      return NextResponse.json(
        { success: false, error: 'សូមបង់ប្រាក់ និងរង់ចាំការអនុម័តជាមុនសិន' },
        { status: 403 }
      );
    }

    const existing = getRegistrations(userId).find(r => r.courseId === course.id);
    if (existing) {
      return NextResponse.json({ success: true, registration: existing });
    }

    const gender = field('gender');
    const required = {
      fullNameKh: 'ឈ្មោះជាអក្សរខ្មែរ',
      fullNameEn: 'ឈ្មោះជាអក្សរឡាតាំង',
      dateOfBirth: 'ថ្ងៃខែឆ្នាំកំណើត',
      phone: 'លេខទូរស័ព្ទ',
      address: 'អាសយដ្ឋាន'
    };
    for (const [key, label] of Object.entries(required)) {
      if (!field(key)) {
        return NextResponse.json({ success: false, error: `សូមបញ្ចូល${label}` }, { status: 400 });
      }
    }
    if (gender !== 'ប្រុស' && gender !== 'ស្រី') {
      return NextResponse.json({ success: false, error: 'សូមជ្រើសរើសភេទ' }, { status: 400 });
    }

    const photo = imageFrom(form, 'photo');
    if (!photo) {
      return NextResponse.json({ success: false, error: 'សូមភ្ជាប់រូបថត ៤x៦' }, { status: 400 });
    }
    const photoError = validateImage(photo);
    if (photoError) {
      return NextResponse.json({ success: false, error: photoError }, { status: 400 });
    }

    const registration = createRegistration({
      userId,
      courseId: course.id,
      courseTitle: course.title,
      courseDuration: course.duration,
      instructorName: course.instructor?.name || '',
      fullNameKh: field('fullNameKh'),
      fullNameEn: field('fullNameEn'),
      gender,
      dateOfBirth: field('dateOfBirth'),
      phone: field('phone'),
      address: field('address'),
      telegramUsername: field('telegramUsername').replace(/^@/, '') || undefined,
      photo: await saveImage(photo, 'student')
    });

    await notifyNewRegistration(registration);

    return NextResponse.json({ success: true, registration });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit registration' }, { status: 500 });
  }
}

export const GET = withDatabase(handleGET);
export const POST = withDatabase(handlePOST);
