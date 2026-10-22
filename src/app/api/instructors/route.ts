import { NextResponse } from 'next/server';
import { getInstructors, saveInstructor } from '@/lib/db';
import { imageFrom, saveImage, validateImage } from '@/lib/uploads';
import { Instructor } from '@/types';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    return NextResponse.json({ success: true, instructors: getInstructors() });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch instructors' }, { status: 500 });
  }
}

// Multipart form: name, title, bio, experience, credentials (one per line), photo (image file)
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const form = await request.formData();
    const field = (name: string) => String(form.get(name) ?? '').trim();

    const name = field('name');
    const photo = imageFrom(form, 'photo');
    if (!name) {
      return NextResponse.json({ success: false, error: 'សូមបញ្ចូលឈ្មោះគ្រូ' }, { status: 400 });
    }
    if (!photo) {
      return NextResponse.json({ success: false, error: 'សូមភ្ជាប់រូបថតគ្រូ (៤x៦)' }, { status: 400 });
    }
    const photoError = validateImage(photo);
    if (photoError) {
      return NextResponse.json({ success: false, error: photoError }, { status: 400 });
    }

    const instructor: Instructor = {
      id: `inst-${Date.now()}`,
      name,
      title: field('title'),
      bio: field('bio'),
      experience: field('experience'),
      credentials: field('credentials').split('\n').map(s => s.trim()).filter(Boolean),
      avatar: await saveImage(photo, 'teacher'),
      rating: 5,
      totalStudents: 0,
      coursesCount: 0
    };

    return NextResponse.json({ success: true, instructor: saveInstructor(instructor) });
  } catch (error) {
    console.error('Error creating instructor:', error);
    return NextResponse.json({ success: false, error: 'Failed to create instructor' }, { status: 500 });
  }
}
